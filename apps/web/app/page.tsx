import DeviceView from './device'
import styles from './page.module.css'

export default function HomePage() {
  return (
    <main className={styles.main}>
      <DeviceView />
    </main>
  )
}
