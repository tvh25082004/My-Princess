import { Heart3D } from "./components/Heart3D";
import { MusicPlayer } from "./components/MusicPlayer";
import { PhotoGallery } from "./components/PhotoGallery";

export default function App() {
  return (
    <main className="app">
      <Heart3D />

      <header className="app-header">
        <p className="app-eyebrow">✨ Forever Yours ✨</p>
        <p className="app-hint">My Princess</p>
      </header>

      <PhotoGallery />

      <MusicPlayer />

      <footer className="app-footer">
        <p>Hà Hiền My · Made with ❤️</p>
      </footer>
    </main>
  );
}
