import Header from '@/components/header'
import styles from './page.module.css'

export default function HomePage(): JSX.Element {
  return (
    <>
      <Header />
      <main className={styles.main}></main>
    </>
  )
}
