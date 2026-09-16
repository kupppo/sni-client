import styles from '../page.module.css'
import FileTree from './tree'

export default function ControlsPage() {
  return (
    <main className={styles.main}>
      <FileTree />
    </main>
  )
}
