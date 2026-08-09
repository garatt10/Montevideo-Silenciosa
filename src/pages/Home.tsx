import MapaMontevideo from '../components/MapaMontevideo'
import Sidebar from '../components/Sidebar'

function Home() {
  return (
    <div className="home">
      <Sidebar />
      <main className="home-map">
        <MapaMontevideo />
      </main>
    </div>
  )
}

export default Home
