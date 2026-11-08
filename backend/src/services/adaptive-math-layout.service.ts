import { getMinimumReadablePixels } from './manim-geometry-qa.service.js';
import type { VideoFormatProfile } from './video-format.service.js';

/** Measured MathTex layout for Manim Community, not ManimGL. */
export function buildAdaptiveManimHelpers(profile: VideoFormatProfile): string {
  const band = profile.orientation === 'portrait' ? 1.08 : profile.orientation === 'square' ? 0.98 : 0.90;
  const minAnchorPixels = getMinimumReadablePixels('problem-anchor', 'MathTex', profile.height);
  const minFormulaPixels = getMinimumReadablePixels('math-primary', 'MathTex', profile.height);
  const minTextPixels = getMinimumReadablePixels(null, 'Text', profile.height);
  const minOtherMathPixels = getMinimumReadablePixels(null, 'MathTex', profile.height);

  const py = `
    def _math(self, expression, font_size=54, color=WHITE, role="math-primary"):
        # Split a single equality into stable tokens for TransformMatchingTex.
        # A derivation with several equal signs or empty side remains intact.
        if expression.count("=") == 1:
            lhs, rhs = expression.split("=", 1)
            if lhs.strip() and rhs.strip():
                result = MathTex(lhs.strip(), "=", rhs.strip(),
                                 font_size=font_size, color=color)
            else:
                result = MathTex(expression, font_size=font_size, color=color)
        else:
            result = MathTex(expression, font_size=font_size, color=color)
        result.qa_role = role
        result.original_expr = expression
        result.math_font_size = font_size
        result.math_color = color
        return result

    def _iter_math(self, obj, role="math-primary"):
        found = []
        seen = set()
        candidates = [obj] if isinstance(obj, MathTex) else [obj, *obj.get_family()]
        for item in candidates:
            if id(item) in seen or not isinstance(item, MathTex):
                continue
            seen.add(id(item))
            if role is None or getattr(item, "qa_role", None) == role:
                found.append(item)
        return found

    def _math_min_height(self, obj, role="math-primary"):
        items = self._iter_math(obj, role=role)
        if not items and role is not None:
            items = self._iter_math(obj, role=None)
        if items:
            return min((item.height for item in items), default=0.0)
        return float(getattr(obj, "height", 0.0))

    def _split_latex_candidates(self, expr):
        expr = (expr or "").strip()
        if not expr:
            return []
        candidates = []

        tokens = []
        depth = 0
        i = 0
        n = len(expr)
        while i < n:
            ch = expr[i]
            if ch == "\\\\":
                j = i + 1
                if j < n and expr[j].isalpha():
                    while j < n and expr[j].isalpha():
                        j += 1
                    tokens.append((i, j, depth, expr[i:j]))
                    i = j
                    continue
                elif j < n:
                    tokens.append((i, i + 2, depth, expr[i:i + 2]))
                    i += 2
                    continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth = max(0, depth - 1)
            elif depth == 0:
                tokens.append((i, i + 1, depth, ch))
            i += 1

        # 1. Leading \\text{...} prose label before a math formula
        for (s, e, d, cmd) in tokens:
            if d == 0 and cmd == "\\\\text" and e < n and expr[e] == "{":
                b_depth = 0
                k = e
                while k < n:
                    if expr[k] == "{":
                        b_depth += 1
                    elif expr[k] == "}":
                        b_depth -= 1
                        if b_depth == 0:
                            break
                    k += 1
                if k < n:
                    head = expr[:k + 1].strip()
                    tail = expr[k + 1:].strip()
                    for sep in ("\\\\;", "\\\\quad", ","):
                        if tail.startswith(sep):
                            tail = tail[len(sep):].strip()
                    if head and tail:
                        candidates.append([head, tail])
                break

        # 2. Top-level comma-separated equations (e.g. coefficients or root pairs)
        comma_positions = [s for (s, _e, d, cmd) in tokens if d == 0 and cmd == ","]
        if comma_positions:
            parts = []
            prev = 0
            for pos in comma_positions:
                chunk = expr[prev:pos].strip()
                for sep in ("\\\\;", "\\\\quad"):
                    if chunk.startswith(sep):
                        chunk = chunk[len(sep):].strip()
                    if chunk.endswith(sep):
                        chunk = chunk[:-len(sep)].strip()
                if chunk:
                    parts.append(chunk)
                prev = pos + 1
            tail = expr[prev:].strip()
            for sep in ("\\\\;", "\\\\quad"):
                if tail.startswith(sep):
                    tail = tail[len(sep):].strip()
            if tail:
                parts.append(tail)
            if len(parts) >= 2:
                if len(parts) > 2:
                    mid = (len(parts) + 1) // 2
                    candidates.append([",\\\\; ".join(parts[:mid]), ",\\\\; ".join(parts[mid:])])
                candidates.append(parts)

        # 3. Top-level relational chains (=, \\approx, \\Rightarrow, <, >, \\leq, \\geq, \\neq)
        rel_cmds = {"=", "<", ">", "\\\\approx", "\\\\Rightarrow", "\\\\leq", "\\\\geq", "\\\\neq"}
        rels = [(s, e, cmd) for (s, e, d, cmd) in tokens if d == 0 and cmd in rel_cmds]
        if len(rels) >= 2:
            first_pos = rels[0][0]
            if first_pos > 0 and expr[:first_pos].strip() and expr[first_pos:].strip():
                candidates.append([expr[:first_pos].strip(), expr[first_pos:].strip()])
            mid_pos = rels[len(rels) // 2][0]
            if mid_pos != first_pos and mid_pos > 0 and expr[:mid_pos].strip() and expr[mid_pos:].strip():
                candidates.append([expr[:mid_pos].strip(), expr[mid_pos:].strip()])
            chain = []
            prev = 0
            for (s, _e, _cmd) in rels:
                chunk = expr[prev:s].strip()
                if chunk:
                    chain.append(chunk)
                prev = s
            tail = expr[prev:].strip()
            if tail:
                chain.append(tail)
            if len(chain) >= 2:
                candidates.append(chain)

        # 4. Single relation with balanced binary + / - terms on RHS
        if len(rels) == 1:
            rel_start, rel_end, _rel_cmd = rels[0]
            p_depth = 0
            bin_positions = []
            last_tok = ""
            for (s, _e, d, cmd) in tokens:
                if cmd == "(":
                    p_depth += 1
                elif cmd == ")":
                    p_depth = max(0, p_depth - 1)
                elif d == 0 and p_depth == 0 and s >= rel_end and cmd in ("+", "-") and last_tok not in ("=", "<", ">", "\\\\approx", "\\\\Rightarrow", "(", ","):
                    bin_positions.append(s)
                if not cmd.isspace():
                    last_tok = cmd
            if bin_positions:
                mid_bin = bin_positions[len(bin_positions) // 2]
                if expr[:mid_bin].strip() and expr[mid_bin:].strip():
                    candidates.append([expr[:mid_bin].strip(), expr[mid_bin:].strip()])
            if rel_start > 0 and expr[:rel_start].strip() and expr[rel_start:].strip():
                candidates.append([expr[:rel_start].strip(), expr[rel_start:].strip()])

        # 5. Sum/difference without top-level relation
        if not rels:
            p_depth = 0
            bin_positions = []
            last_tok = ""
            for (s, _e, d, cmd) in tokens:
                if cmd == "(":
                    p_depth += 1
                elif cmd == ")":
                    p_depth = max(0, p_depth - 1)
                elif d == 0 and p_depth == 0 and cmd in ("+", "-") and s > 0 and last_tok not in ("(", ","):
                    bin_positions.append(s)
                if not cmd.isspace():
                    last_tok = cmd
            if bin_positions:
                mid_bin = bin_positions[len(bin_positions) // 2]
                if expr[:mid_bin].strip() and expr[mid_bin:].strip():
                    candidates.append([expr[:mid_bin].strip(), expr[mid_bin:].strip()])

        # 6. Pure \\text{...} phrase wrapped into balanced words
        if expr.startswith("\\\\text{") and expr.endswith("}"):
            inner = expr[6:-1].strip()
            words = inner.split()
            if len(words) >= 2:
                mid = len(words) // 2
                candidates.append([
                    "\\\\text{" + " ".join(words[:mid]) + "}",
                    "\\\\text{" + " ".join(words[mid:]) + "}",
                ])

        deduped = []
        seen_keys = set()
        for cand in candidates:
            key = tuple(cand)
            if key not in seen_keys and len(cand) >= 2:
                seen_keys.add(key)
                deduped.append(cand)
        return deduped

    def _build_wrapped_math(self, expression, font_size, color, role, max_width, max_height, min_pixels, pixel_ratio):
        single = self._math(expression, font_size=font_size, color=color, role=role)
        single_min_h = max(self._math_min_height(single, role=role), 0.001)
        single_req = min_pixels / (single_min_h * pixel_ratio)
        target_scale = max(1.0, single_req * 1.05)
        if single.width * target_scale <= max_width and single.height * target_scale <= max_height:
            return single
        best = single
        best_score = -1.0
        for lines in self._split_latex_candidates(expression):
            try:
                submaths = [self._math(line, font_size=font_size, color=color, role=role) for line in lines]
            except Exception:
                continue
            wrapped = VGroup(*submaths).arrange(DOWN, aligned_edge=LEFT, buff=0.14)
            wrapped.original_expr = expression
            wrapped.math_font_size = font_size
            wrapped.math_color = color
            wrapped.qa_role = role
            line_min_h = max(self._math_min_height(wrapped, role=role), 0.001)
            fit_scale = min(max_width / max(wrapped.width, 0.001), max_height / max(wrapped.height, 0.001))
            req = min_pixels / (line_min_h * pixel_ratio)
            achieved_px = line_min_h * fit_scale * pixel_ratio
            if wrapped.width * max(1.0, req * 1.05) <= max_width and wrapped.height * max(1.0, req * 1.05) <= max_height:
                return wrapped
            if achieved_px > best_score:
                best = wrapped
                best_score = achieved_px
        return best

    def _work_bounds(self):
        top = @@FRAMEHEIGHT@@ / 2
        bottom = -@@FRAMEHEIGHT@@ / 2
        margin = @@MARGIN@@
        band_height = @@BAND@@
        band_center = top - margin - band_height / 2
        content_top = top - margin - band_height - 0.95
        content_bottom = bottom + margin + 0.20
        if content_top - content_bottom < 1.1:
            raise ValueError("LAYOUT_FRAME_TOO_SMALL: no queda zona útil debajo del ejercicio")
        return {
            "anchor_center": band_center, "anchor_height": band_height,
            "header_y": content_top + 0.52, "top": content_top, "bottom": content_bottom,
            "center_y": (content_top + content_bottom) / 2,
            "height": content_top - content_bottom, "width": @@CONTENTWIDTH@@
        }

    def _create_problem_anchor(self, latex):
        bounds = self._work_bounds()
        panel = RoundedRectangle(
            width=@@PANELWIDTH@@, height=bounds["anchor_height"],
            corner_radius=0.16, fill_color="#1B304A", fill_opacity=1,
            stroke_color=BLUE_D, stroke_width=1.8)
        panel.move_to(UP * bounds["anchor_center"])
        caption = Text("EJERCICIO", font_size=19, color=GREY_A)
        formula = self._math(latex, font_size=52, color=WHITE, role="problem-anchor")
        # Keep the original equation legible; the caption is optional.
        available_width = @@PANELWIDTH@@ - 0.42
        available_height = bounds["anchor_height"] - 0.24
        min_pixels = @@MINANCHORPX@@
        pixels_per_unit = @@PIXELHEIGHT@@ / @@FRAMEHEIGHT@@
        req_scale = min_pixels / max(formula.height * pixels_per_unit, 0.001)
        max_anchor_scale = max(1.20, min(2.20, req_scale * 1.04))
        decorated = VGroup(caption, formula).arrange(RIGHT, buff=0.43)
        decorated_scale = min(max_anchor_scale, available_width / max(decorated.width, 0.001),
                              available_height / max(decorated.height, 0.001))
        if formula.height * decorated_scale * pixels_per_unit >= min_pixels:
            group = decorated
            factor = decorated_scale
        else:
            solo = self._build_wrapped_math(
                latex, 52, WHITE, "problem-anchor",
                available_width, available_height, min_pixels, pixels_per_unit
            )
            group = VGroup(formula) if isinstance(solo, MathTex) else solo
            solo_min_h = max(self._math_min_height(group, role="problem-anchor"), 0.001)
            solo_req = min_pixels / (solo_min_h * pixels_per_unit)
            factor = min(max(1.20, min(2.20, solo_req * 1.04)),
                         available_width / max(group.width, 0.001),
                         available_height / max(group.height, 0.001))
            if self._math_min_height(group, role="problem-anchor") * factor * pixels_per_unit < min_pixels:
                raise ValueError("LAYOUT_ANCHOR_UNREADABLE: el enunciado debe dividirse en líneas")
        group.scale(factor)
        group.move_to(panel.get_center())
        anchor = VGroup(panel, group)
        anchor.set_z_index(95)
        self.add(anchor)
        return anchor

    def _place_heading(self, heading):
        bounds = self._work_bounds()
        heading.scale(min(1.18, bounds["width"] / max(heading.width, 0.001)))
        heading.move_to(UP * bounds["header_y"])
        return heading

    def _fit_work(self, group, max_upscale=1.20, min_scale=0.57):
        bounds = self._work_bounds()
        if group.width <= 0 or group.height <= 0:
            raise ValueError("LAYOUT_EMPTY: no hay objetos de contenido")
        factor = min(max_upscale, bounds["width"] / group.width,
                     bounds["height"] / group.height)
        if factor < min_scale:
            raise ValueError("LAYOUT_UNREADABLE: dividir la derivación en más escenas")
        group.scale(factor)
        group.move_to(UP * bounds["center_y"])
        return group

    def _constrain_text_for_math(self, text_obj, max_width, min_text_pixels, pixel_ratio, target_scale):
        if text_obj is None or text_obj.width <= 0 or text_obj.height <= 0:
            return text_obj
        if text_obj.width * target_scale <= max_width:
            return text_obj
        raw_text = str(getattr(text_obj, "text", getattr(text_obj, "original_text", ""))).strip()
        words = raw_text.split()
        if len(words) >= 3:
            mid = (len(words) + 1) // 2
            wrapped_str = " ".join(words[:mid]) + "\\n" + " ".join(words[mid:])
            font_size = getattr(text_obj, "font_size", 22)
            color = text_obj.get_color()
            candidate = Text(wrapped_str, font_size=font_size, color=color)
            if candidate.width < text_obj.width:
                text_obj = candidate
        if text_obj.width * target_scale > max_width:
            shrink = (max_width / target_scale) / max(text_obj.width, 0.001)
            min_h_allowed = min_text_pixels / max(pixel_ratio * target_scale, 0.001)
            if text_obj.height * shrink >= min_h_allowed:
                text_obj.scale(shrink)
            elif text_obj.height > min_h_allowed:
                text_obj.scale(min_h_allowed / text_obj.height)
        return text_obj

    def _arrange_equation_stages(self, stages):
        if not len(stages):
            raise ValueError("LAYOUT_EMPTY_STAGES")
        # Measure actual MathTex widths after TeX has built fractions and roots.
        stages.arrange(DOWN, aligned_edge=LEFT, buff=0.23)
        bounds = self._work_bounds()
        factor = min(1.14, bounds["width"] / max(stages.width, 0.001),
                     bounds["height"] / max(stages.height, 0.001))
        # Use the exact same pixel legibility floor as Manim Geometry QA.
        pixel_ratio = @@PIXELHEIGHT@@ / @@FRAMEHEIGHT@@
        min_formula_pixels = @@MINFORMULAPX@@
        min_text_pixels = @@MINTEXTPX@@
        readable_together = all(
            len(stage) > 1 and self._math_min_height(stage[1]) * factor * pixel_ratio >= min_formula_pixels
            for stage in stages
        )
        if factor >= 0.78 and readable_together:
            self._fit_work(stages, max_upscale=1.14, min_scale=0.78)
            return False
        # Never shrink all derivations to preserve a crowded layout.
        for stage in stages:
            if len(stage) <= 1 or self._math_min_height(stage[1]) <= 0:
                raise ValueError("LAYOUT_STAGE_UNREADABLE: fórmula ausente")
            formula = stage[1]
            label = stage[0]
            detail = stage[2] if len(stage) > 2 else None
            required_scale = min_formula_pixels / max(self._math_min_height(formula) * pixel_ratio, 0.001)
            desired_scale = max(1.14, min(2.80, required_scale * 1.05))
            # Prevent decorative caption/detail width from shrinking the math formula.
            label = self._constrain_text_for_math(label, bounds["width"] * 0.94, min_text_pixels, pixel_ratio, desired_scale)
            if detail is not None:
                detail = self._constrain_text_for_math(detail, bounds["width"] * 0.94, min_text_pixels, pixel_ratio, desired_scale)
            # If the formula itself is wider than bounds at readable height, split into coherent lines.
            if formula.width * desired_scale > bounds["width"] * 0.96 and hasattr(formula, "original_expr"):
                avail_h = max(0.8, bounds["height"] - (label.height + (detail.height if detail is not None else 0) + 0.35) * min(desired_scale, 1.5))
                formula = self._build_wrapped_math(
                    formula.original_expr,
                    getattr(formula, "math_font_size", 55),
                    getattr(formula, "math_color", WHITE),
                    getattr(formula, "qa_role", "math-primary"),
                    bounds["width"] * 0.96,
                    avail_h / max(desired_scale, 1.0),
                    min_formula_pixels,
                    pixel_ratio,
                )
            stage.remove(*list(stage))
            items = [label, formula] + ([detail] if detail is not None else [])
            stage.add(*items)
            stage.arrange(DOWN, buff=0.10)
            required_scale = min_formula_pixels / max(self._math_min_height(stage[1]) * pixel_ratio, 0.001)
            self._fit_work(stage, max_upscale=max(1.14, min(2.80, required_scale * 1.05)), min_scale=0.55)
            if self._math_min_height(stage[1]) * pixel_ratio < min_formula_pixels:
                raise ValueError("LAYOUT_STAGE_UNREADABLE: dividir la fórmula en subpasos")
        return True

    def _arrange_card_pairs(self, pairs):
        if not len(pairs):
            raise ValueError("LAYOUT_EMPTY_CARDS")
        bounds = self._work_bounds()
        pixel_ratio = @@PIXELHEIGHT@@ / @@FRAMEHEIGHT@@
        min_formula_pixels = @@MINFORMULAPX@@
        min_text_pixels = @@MINTEXTPX@@
        min_other_math_pixels = @@MINOTHERMATHPX@@
        pairs.arrange(DOWN, buff=0.35)
        needed_scales = [
            min_formula_pixels / max(self._math_min_height(pair) * pixel_ratio, 0.001)
            for pair in pairs
        ]
        max_upscale_stack = max(1.65, min(2.25, max(needed_scales) * 1.05))
        factor = min(max_upscale_stack, bounds["width"] / max(pairs.width, 0.001),
                     bounds["height"] / max(pairs.height, 0.001))
        readable_together = factor >= 0.72 and all(
            self._math_min_height(pair) * factor * pixel_ratio >= min_formula_pixels
            for pair in pairs
        )
        if readable_together:
            captions_ok = True
            for pair in pairs:
                for child in pair:
                    if getattr(child, "qa_role", None) == "math-primary":
                        continue
                    req_min = min_text_pixels if isinstance(child, Text) else min_other_math_pixels
                    if child.height * factor * pixel_ratio < req_min:
                        captions_ok = False
                        break
            if captions_ok:
                self._fit_work(pairs, max_upscale=max_upscale_stack, min_scale=0.72)
                return False
        # Focused card-by-card mode: split wide checks/formulas cleanly so narrow frames never squeeze math.
        for pair in pairs:
            formula = None
            caption = None
            for child in pair:
                if formula is None and (getattr(child, "qa_role", None) == "math-primary" or isinstance(child, MathTex)):
                    formula = child
                elif caption is None and (isinstance(child, (Text, MathTex, Tex)) and child.height > 0):
                    caption = child
            if formula is None:
                continue
            req_scale = min_formula_pixels / max(self._math_min_height(formula) * pixel_ratio, 0.001)
            desired_scale = max(1.65, min(2.80, req_scale * 1.06))
            if caption is not None and isinstance(caption, Text):
                caption = self._constrain_text_for_math(caption, bounds["width"] * 0.94, min_text_pixels, pixel_ratio, desired_scale)
            elif caption is not None and hasattr(caption, "original_expr"):
                cap_min_px = min_other_math_pixels
                caption = self._build_wrapped_math(
                    caption.original_expr,
                    getattr(caption, "math_font_size", 29),
                    getattr(caption, "math_color", GREY_B),
                    getattr(caption, "qa_role", "math-caption"),
                    bounds["width"] * 0.94,
                    bounds["height"] * 0.30,
                    cap_min_px,
                    pixel_ratio,
                )
            if formula.width * desired_scale > bounds["width"] * 0.96 and hasattr(formula, "original_expr"):
                avail_h = max(1.2, bounds["height"] - (caption.height * min(desired_scale, 1.5) + 0.3 if caption is not None else 0.0))
                formula = self._build_wrapped_math(
                    formula.original_expr,
                    getattr(formula, "math_font_size", 52),
                    getattr(formula, "math_color", YELLOW),
                    getattr(formula, "qa_role", "math-primary"),
                    bounds["width"] * 0.96,
                    avail_h / max(desired_scale, 1.0),
                    min_formula_pixels,
                    pixel_ratio,
                )
            pair.remove(*list(pair))
            items = [formula] + ([caption] if caption is not None else [])
            pair.add(*items)
            pair.arrange(DOWN, buff=0.18)
            req_scale = min_formula_pixels / max(self._math_min_height(pair) * pixel_ratio, 0.001)
            self._fit_work(pair, max_upscale=max(1.65, min(2.80, req_scale * 1.06)), min_scale=0.55)
            if self._math_min_height(pair) * pixel_ratio < min_formula_pixels:
                raise ValueError("LAYOUT_CARD_UNREADABLE: dividir la tarjeta en subpasos")
            if caption is not None and caption.height > 0:
                cap_min = min_text_pixels if isinstance(caption, Text) else min_other_math_pixels
                cap_h_px = caption.height * pixel_ratio
                if cap_h_px < cap_min:
                    raise ValueError("LAYOUT_CARD_UNREADABLE: subtítulo ilegible")
        return True

    def _fit_recap_pair(self, pair):
        bounds = self._work_bounds()
        pixel_ratio = @@PIXELHEIGHT@@ / @@FRAMEHEIGHT@@
        min_formula_pixels = @@MINFORMULAPX@@
        min_text_pixels = @@MINTEXTPX@@
        if len(pair) < 2:
            raise ValueError("LAYOUT_RECAP_UNREADABLE: elemento de recapitulación inválido")
        label = pair[0]
        formula = pair[1]
        req_scale = min_formula_pixels / max(self._math_min_height(formula) * pixel_ratio, 0.001)
        desired_scale = max(1.65, min(2.80, req_scale * 1.06))
        if isinstance(label, Text) and label.height > 0:
            label = self._constrain_text_for_math(label, bounds["width"] * 0.94, min_text_pixels, pixel_ratio, desired_scale)
        if formula.width * desired_scale > bounds["width"] * 0.96 and hasattr(formula, "original_expr"):
            formula = self._build_wrapped_math(
                formula.original_expr,
                getattr(formula, "math_font_size", 53),
                getattr(formula, "math_color", YELLOW),
                getattr(formula, "qa_role", "math-primary"),
                bounds["width"] * 0.96,
                bounds["height"] * 0.72,
                min_formula_pixels,
                pixel_ratio,
            )
        pair.remove(*list(pair))
        pair.add(label, formula)
        pair.arrange(DOWN, buff=0.14)
        req_scale = min_formula_pixels / max(self._math_min_height(pair[1]) * pixel_ratio, 0.001)
        self._fit_work(pair, max_upscale=max(1.65, min(2.80, req_scale * 1.06)), min_scale=0.55)
        if self._math_min_height(pair[1]) * pixel_ratio < min_formula_pixels:
            raise ValueError("LAYOUT_RECAP_UNREADABLE: dividir la recapitulación")
        return pair


    def _focus_math(self, obj, run_time=0.35, color=None):
        # Highlight the verified right-hand side without moving the equation.
        # A wrapped equation remains a semantic MathTex group.
        math = self._iter_math(obj, role=None)
        target = math[-1] if math else obj
        if isinstance(target, MathTex) and len(target) == 3:
            target = target[2]
        self.play(Indicate(target, color=(color if color is not None else YELLOW), scale_factor=1.035), run_time=run_time)

    def _make_final_recap_formula(self, expression, font_size, color):
        bounds = self._work_bounds()
        return self._build_wrapped_math(
            expression, font_size, color, "math-primary",
            bounds["width"] * 0.96, bounds["height"] * 0.50,
            @@MINFORMULAPX@@, @@PIXELHEIGHT@@ / @@FRAMEHEIGHT@@
        )

    def _fit_final_recap(self, summary):
        # The original problem already owns the top band; keep both answers
        # and the verification permanently visible beneath it.
        bounds = self._work_bounds()
        pixel_ratio = @@PIXELHEIGHT@@ / @@FRAMEHEIGHT@@
        formula_min_px = @@MINFORMULAPX@@
        summary.arrange(DOWN, buff=0.36)
        math = self._iter_math(summary, role="math-primary")
        if len(math) < 2:
            raise ValueError("LAYOUT_FINAL_RECAP_EMPTY: faltan las conclusiones")
        smallest = min(item.height for item in math)
        if smallest <= 0 or summary.width <= 0 or summary.height <= 0:
            raise ValueError("LAYOUT_FINAL_RECAP_EMPTY: fórmula de cierre inválida")
        required_scale = formula_min_px / (smallest * pixel_ratio)
        scale = min(max(1.65, min(2.50, required_scale * 1.06)),
                    bounds["width"] / summary.width,
                    bounds["height"] / summary.height)
        if any(item.height * scale * pixel_ratio + 0.2 < formula_min_px for item in math):
            raise ValueError("LAYOUT_FINAL_RECAP_UNREADABLE: dividir el resumen")
        summary.scale(scale)
        summary.move_to(UP * bounds["center_y"])
        return summary

    def _fit_fallback_group(self, group):
        bounds = self._work_bounds()
        pixel_ratio = @@PIXELHEIGHT@@ / @@FRAMEHEIGHT@@
        min_text_pixels = @@MINTEXTPX@@
        min_other_math_pixels = @@MINOTHERMATHPX@@
        factor = min(1.65, bounds["width"] / max(group.width, 0.001),
                     bounds["height"] / max(group.height, 0.001))
        if factor < 0.70 or any(
            isinstance(child, MathTex) and child.width * 1.1 > bounds["width"]
            for child in group
        ):
            new_children = []
            for child in group:
                if isinstance(child, Text):
                    new_children.append(self._constrain_text_for_math(child, bounds["width"] * 0.94, min_text_pixels, pixel_ratio, 1.0))
                elif isinstance(child, MathTex) and hasattr(child, "original_expr"):
                    new_children.append(self._build_wrapped_math(
                        child.original_expr,
                        getattr(child, "math_font_size", 42),
                        getattr(child, "math_color", WHITE),
                        getattr(child, "qa_role", None),
                        bounds["width"] * 0.96,
                        bounds["height"] * 0.45,
                        min_other_math_pixels,
                        pixel_ratio,
                    ))
                else:
                    new_children.append(child)
            group.remove(*list(group))
            group.add(*new_children)
            group.arrange(DOWN, buff=0.24)
        return self._fit_work(group, max_upscale=1.65, min_scale=0.55)

    def _sanitize_graph_labels(self, header, concavity, *labels):
        pixel_ratio = @@PIXELHEIGHT@@ / @@FRAMEHEIGHT@@
        min_other_math_pixels = @@MINOTHERMATHPX@@
        safe_x_min = -@@FRAMEWIDTH@@ / 2 + @@MARGIN@@ + 0.08
        safe_x_max = @@FRAMEWIDTH@@ / 2 - @@MARGIN@@ - 0.08
        safe_y_max = header.get_bottom()[1] - 0.14
        safe_y_min = concavity.get_top()[1] + 0.14
        if safe_y_max <= safe_y_min:
            return
        max_lbl_w = (safe_x_max - safe_x_min) * 0.48
        placed = []

        def _clamp(obj):
            if obj.width > max_lbl_w:
                min_h = min_other_math_pixels / max(pixel_ratio, 0.001)
                ratio = max_lbl_w / max(obj.width, 0.001)
                if obj.height * ratio >= min_h:
                    obj.scale(ratio)
                elif obj.height > min_h:
                    obj.scale(min_h / obj.height)
            dx = 0.0
            dy = 0.0
            if obj.get_left()[0] < safe_x_min:
                dx = safe_x_min - obj.get_left()[0]
            elif obj.get_right()[0] > safe_x_max:
                dx = safe_x_max - obj.get_right()[0]
            if obj.get_bottom()[1] < safe_y_min:
                dy = safe_y_min - obj.get_bottom()[1]
            elif obj.get_top()[1] > safe_y_max:
                dy = safe_y_max - obj.get_top()[1]
            if dx != 0.0 or dy != 0.0:
                obj.shift(RIGHT * dx + UP * dy)

        def _overlaps(a, b, pad=0.06):
            return (
                min(a.get_right()[0], b.get_right()[0]) + pad > max(a.get_left()[0], b.get_left()[0])
                and min(a.get_top()[1], b.get_top()[1]) + pad > max(a.get_bottom()[1], b.get_bottom()[1])
            )

        for lbl in labels:
            if lbl is None or lbl.width <= 0 or lbl.height <= 0:
                continue
            _clamp(lbl)
            if any(_overlaps(lbl, other) for other in placed):
                orig = lbl.get_center().copy()
                step_y = max(lbl.height + 0.14, 0.42)
                step_x = max(lbl.width * 0.55, 0.65)
                offsets = [
                    UP * step_y, DOWN * step_y,
                    LEFT * step_x, RIGHT * step_x,
                    UP * (step_y * 2), DOWN * (step_y * 2),
                ]
                for off in offsets:
                    lbl.move_to(orig + off)
                    _clamp(lbl)
                    if not any(_overlaps(lbl, other) for other in placed):
                        break
                else:
                    lbl.move_to(orig)
                    _clamp(lbl)
            placed.append(lbl)
`;
  const transition = `
    def _animate_equation_step(self, stages, index, focused, run_time=0.25):
        """Animate the verified substitution, keeping common LaTeX symbols."""
        current = stages[index]
        if index == 0:
            self.play(FadeIn(current), run_time=run_time)
            return
        previous = stages[index - 1]
        if isinstance(previous[1], MathTex) and isinstance(current[1], MathTex):
            tex_anim = TransformMatchingTex(previous[1].copy(), current[1], transform_mismatches=True)
        else:
            tex_anim = ReplacementTransform(previous[1].copy(), current[1])
        animations = [
            FadeIn(current[0]),
            tex_anim,
        ]
        if len(current) > 2:
            animations.append(FadeIn(current[2]))
        if focused:
            animations.append(FadeOut(previous))
        self.play(*animations, run_time=run_time)
`;
  const variables: Record<string, string> = {
    FRAMEWIDTH: profile.frameWidth.toFixed(5),
    FRAMEHEIGHT: profile.frameHeight.toFixed(5),
    MARGIN: profile.safeMargin.toFixed(5),
    BAND: band.toFixed(5),
    CONTENTWIDTH: profile.contentWidth.toFixed(5),
    PANELWIDTH: profile.panelWidth.toFixed(5),
    PIXELHEIGHT: String(profile.height),
    MINANCHORPX: minAnchorPixels.toFixed(3),
    MINFORMULAPX: minFormulaPixels.toFixed(3),
    MINTEXTPX: minTextPixels.toFixed(3),
    MINOTHERMATHPX: minOtherMathPixels.toFixed(3),
  };
  return (py + transition).replace(/@@([A-Z]+)@@/g, (_match, variable: string) => variables[variable] || _match);
}

/** Only a verified problem expression is shown in the lesson-wide anchor. */
export function selectProblemAnchor(scene: {
  content?: string;
  pedagogicalScenes?: Array<{ id: string; visualLatex?: string[] }>;
}): string | null {
  const intro = scene.pedagogicalScenes?.find((item) => item.id === 'hook');
  const candidate = (intro?.visualLatex?.[0] || scene.content || '').trim();
  if (candidate.length < 3 || candidate.length > 140 || !candidate.includes('=')
      || /(?:\\write18|\\input|\\include|\\openout|\\read|\\catcode|\\def\b)/i.test(candidate)) {
    return null;
  }
  return candidate;
}
