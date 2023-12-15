import FileTree from './tree'
import styles from '../page.module.css'

export default function ControlsPage(): JSX.Element {
  return (
    <main className={styles.main}>
      <FileTree />
    </main>
  )
}
