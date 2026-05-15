import { env } from '../config/env'

export function Home() {
  return (
    <section className="home">
      <h1>Issue Tracker</h1>
      <p>
        Frontend en React conectado al backend Django desplegado en Render.
      </p>
      <p className="home-api">
        API: <code>{env.apiBaseUrl}</code>
      </p>
    </section>
  )
}
