import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

const ffmpegCandidates = [
  'C:\\Users\\pc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0-full_build\\bin\\ffmpeg.exe',
  'C:\\ffmpeg\\bin\\ffmpeg.exe',
  'ffmpeg',
];

const ffprobeCandidates = [
  'C:\\Users\\pc\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0-full_build\\bin\\ffprobe.exe',
  'C:\\ffmpeg\\bin\\ffprobe.exe',
  'ffprobe',
];

const resolveBinary = (candidates: string[]) => {
  for (const candidate of candidates) {
    if (candidate.includes('\\') || candidate.includes('/')) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } else if (candidate === 'ffmpeg' || candidate === 'ffprobe' || candidate === 'manim') {
      return candidate;
    }
  }
  return candidates[candidates.length - 1];
};

/**
 * FFmpeg Service - Procesamiento de video
 * Requiere: FFmpeg instalado (https://ffmpeg.org)
 */

interface VideoProcessingOptions {
  inputPath: string;
  outputPath: string;
  width?: number;
  height?: number;
  resolution?: string; // compatibilidad con llamadas antiguas
  fps?: number; // Frames per second
  bitrate?: string; // "5000k" | "10000k"
}

export const ffmpeg = {
  getCommand(): string {
    return resolveBinary(ffmpegCandidates);
  },
  getProbeCommand(): string {
    return resolveBinary(ffprobeCandidates);
  },
  /**
   * Procesar y optimizar video
   */
  async processVideo(options: VideoProcessingOptions): Promise<string> {
    try {
      const {
        inputPath,
        outputPath,
        width,
        height,
        resolution = '1080',
        fps = 30,
        bitrate = '5000k',
      } = options;

      // Validar que archivo de entrada existe
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }

      // Construir comando FFmpeg
      const ffmpegCommand = this.getCommand();
      let cmd = `"${ffmpegCommand}" -i "${inputPath}"`;

      // Dimensiones explícitas con padding: nunca estirar ni deformar contenido.
      const targetWidth = width || (resolution === '4k' ? 3840 : resolution === '1080' ? 1920 : 854);
      const targetHeight = height || (resolution === '4k' ? 2160 : resolution === '1080' ? 1080 : 480);
      cmd += ` -vf "scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:color=#000000"`;

      // FPS y bitrate
      cmd += ` -r ${fps} -b:v ${bitrate}`;

      // Codec (H.264 para mejor compatibilidad)
      cmd += ' -c:v libx264 -preset fast';

      // Audio
      cmd += ' -c:a aac -b:a 128k';

      // Output
      cmd += ` -y "${outputPath}"`;

      console.log(`🎬 FFmpeg processing: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);

      const { stderr } = await execAsync(cmd, {
        maxBuffer: 1024 * 1024 * 50,
      });

      if (stderr && !stderr.includes('frame=')) {
        console.warn('⚠️  FFmpeg warnings:', stderr);
      }

      if (!fs.existsSync(outputPath)) {
        throw new Error('Output video not created');
      }

      const fileSize = fs.statSync(outputPath).size;
      console.log(`✓ Video processed: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

      return outputPath;
    } catch (error) {
      console.error('❌ FFmpeg error:', error);
      throw error;
    }
  },

  /**
   * Extraer thumbnail del video
   */
  async extractThumbnail(
    videoPath: string,
    outputPath: string,
    timeCode: string = '00:00:08',
    width = 1280,
    height = 720,
  ): Promise<string> {
    try {
      const ffmpegCommand = this.getCommand();
      // Rendered scenes spend their first seconds writing text. Extract after
      // that transition so the library thumbnail captures a stable equation,
      // not a black frame or partially written glyphs.
      const filter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=#000000`;
      const representativeCmd = `"${ffmpegCommand}" -ss ${timeCode} -i "${videoPath}" -vf "${filter}" -frames:v 1 -y "${outputPath}"`;
      await execAsync(representativeCmd, { maxBuffer: 1024 * 1024 * 10 });

      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
        const fallbackCmd = `"${ffmpegCommand}" -ss 00:00:02 -i "${videoPath}" -vf "${filter}" -frames:v 1 -y "${outputPath}"`;
        await execAsync(fallbackCmd, { maxBuffer: 1024 * 1024 * 10 });
      }

      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
        throw new Error('Thumbnail not created');
      }

      console.log(`✓ Thumbnail extracted: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('❌ FFmpeg thumbnail error:', error);
      throw error;
    }
  },

  /**
   * Unir segmentos de narración sin recomprimir el audio PCM.
   */
  async concatenateAudio(audioPaths: string[], outputPath: string): Promise<string> {
    if (!audioPaths.length) throw new Error('No hay segmentos de audio para concatenar');

    for (const audioPath of audioPaths) {
      if (!fs.existsSync(audioPath) || fs.statSync(audioPath).size < 1024) {
        throw new Error(`Segmento de audio inválido o vacío: ${audioPath}`);
      }
      const metadata = await this.getVideoInfo(audioPath);
      const audioStream = metadata?.streams?.find((stream: any) => stream.codec_type === 'audio');
      const duration = Number(metadata?.format?.duration);
      if (!audioStream || !Number.isFinite(duration) || duration <= 0) {
        throw new Error(`Segmento de audio no decodificable: ${audioPath}`);
      }
    }

    const concatPath = path.join(path.dirname(outputPath), `${path.basename(outputPath)}.concat.txt`);
    const concatContent = audioPaths
      .map((audioPath) => `file '${path.resolve(audioPath).replace(/'/g, "'\\\\''")}'`)
      .join('\n');
    fs.writeFileSync(concatPath, concatContent);

    try {
      const ffmpegCommand = this.getCommand();
      const cmd = `"${ffmpegCommand}" -f concat -safe 0 -i "${concatPath}" -c:a pcm_s16le -y "${outputPath}"`;
      await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });
      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
        throw new Error('Audio concatenado no creado');
      }
      return outputPath;
    } finally {
      if (fs.existsSync(concatPath)) fs.unlinkSync(concatPath);
    }
  },

  /**
   * Combinar múltiples videos
   */
  async concatenateVideos(
    videoPaths: string[],
    outputPath: string,
    concatFile?: string
  ): Promise<string> {
    try {
      // Crear archivo concat
      const concatContent = videoPaths
        .map((p) => `file '${path.resolve(p)}'`)
        .join('\n');

      const concatPath = concatFile || path.join(path.dirname(outputPath), 'concat.txt');
      fs.writeFileSync(concatPath, concatContent);

      const ffmpegCommand = this.getCommand();
      const cmd = `"${ffmpegCommand}" -f concat -safe 0 -i "${concatPath}" -c copy -y "${outputPath}"`;

      await execAsync(cmd);

      // Limpiar archivo concat
      fs.unlinkSync(concatPath);

      if (!fs.existsSync(outputPath)) {
        throw new Error('Concatenated video not created');
      }

      console.log(`✓ Videos concatenated: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('❌ FFmpeg concat error:', error);
      throw error;
    }
  },

  /**
   * Obtener información del video
   */
  async getVideoInfo(videoPath: string) {
    try {
      const ffprobeCommand = this.getProbeCommand();
      const cmd = `"${ffprobeCommand}" -v error -show_format -show_streams -of json "${videoPath}"`;

      const { stdout } = await execAsync(cmd);
      return JSON.parse(stdout);
    } catch (error) {
      console.error('❌ FFprobe error:', error);
      throw error;
    }
  },

  /**
   * Mezclar audio narrado con el video generado.
   */
  async mergeAudioWithVideo({
    videoPath,
    audioPath,
    outputPath,
  }: {
    videoPath: string;
    audioPath: string;
    outputPath: string;
  }): Promise<string> {
    try {
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`);
      }

      const ffmpegCommand = this.getCommand();
      const cmd = `"${ffmpegCommand}" -i "${videoPath}" -i "${audioPath}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -movflags +faststart -y "${outputPath}"`;
      await execAsync(cmd);

      if (!fs.existsSync(outputPath)) {
        throw new Error('Output video with narration not created');
      }

      console.log(`✓ Video con narración generado: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('❌ FFmpeg narration merge error:', error);
      throw error;
    }
  },

  /**
   * Verificar si FFmpeg está instalado
   */
  async isInstalled(): Promise<boolean> {
    try {
      const ffmpegCommand = this.getCommand();
      await execAsync(`"${ffmpegCommand}" -version`);
      return true;
    } catch {
      return false;
    }
  },
};
