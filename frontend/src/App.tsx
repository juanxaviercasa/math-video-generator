import React from 'react'
import { VideoGenerator } from './components/VideoGenerator'
import { useVideoStore } from './store/video.store'

function App() {
  const videos = useVideoStore((state) => state.videos)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <header className="border-b border-slate-700 sticky top-0 z-50 bg-slate-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">🎓 Math Video Generator</h1>
              <p className="text-slate-400 mt-1">Transforma problemas matemáticos en videos educativos</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">v0.1.0 Beta</div>
              <div className="text-xs text-slate-500 mt-1">Generador de IA</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Panel de generación */}
          <div className="lg:col-span-1">
            <VideoGenerator />
          </div>

          {/* Panel de videos */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                Videos Generados ({videos.length})
              </h2>

              {videos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎬</div>
                  <p className="text-slate-400">
                    Crea tu primer video matemático en el panel izquierdo
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="bg-slate-700 border border-slate-600 rounded-lg p-4 hover:border-blue-500 transition"
                    >
                      {/* Thumbnail placeholder */}
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                      ) : (
                        <div className="w-full h-32 bg-slate-600 rounded mb-3 flex items-center justify-center">
                          <span className="text-slate-400">
                            {video.status === 'completed' ? '✓' : '...'}
                          </span>
                        </div>
                      )}

                      {/* Info */}
                      <h3 className="font-bold text-white">{video.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {video.content}
                      </p>

                      {/* Status */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-slate-400">
                              {video.status === 'completed'
                                ? '✓ Completado'
                                : video.status === 'failed'
                                ? '✗ Error'
                                : '⏳ Procesando...'}
                            </span>
                            <span className="text-xs font-bold text-blue-400">
                              {video.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-600 rounded-full h-1">
                            <div
                              className="bg-blue-500 h-1 rounded-full transition-all"
                              style={{ width: `${video.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {video.videoUrl && (
                        <a
                          href={video.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-3 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                        >
                          📥 Descargar
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid md:grid-cols-4 gap-4">
          {[
            { icon: '⚡', title: 'Rápido', desc: 'Genera videos en minutos' },
            { icon: '🤖', title: 'Inteligente', desc: 'Usa IA para pasos claros' },
            { icon: '🎨', title: 'Profesional', desc: 'Animaciones de calidad' },
            { icon: '🌍', title: 'Accesible', desc: 'Para cualquier dispositivo' },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center hover:border-blue-600 transition"
            >
              <div className="text-3xl mb-2">{feature.icon}</div>
              <h3 className="font-bold text-white text-sm">{feature.title}</h3>
              <p className="text-slate-400 text-xs mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-700 mt-20 py-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>
            🚀 Math Video Generator v0.1.0 Beta
            {' | '}
            <a
              href="https://github.com/duckmartians/math-video-generator"
              className="text-blue-400 hover:text-blue-300"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
