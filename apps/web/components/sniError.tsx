export default function SNIError({ error }: { error: Error }): JSX.Element {
  if (error.message.includes('Missing Filesystem Capabilities')) {
    return <div>Missing Filesystem Capabilities</div>
  } else if (error.message.includes('NoConnection')) {
    return (
      <article className="max-w-xl">
        <h1 className="text-3xl font-bold mb-2">Cannot connect to SNI</h1>
        <p className="mb-12">
          Unfortunately, we cannot connect to SNI on your machine.
          <br />
          Here are some ideas to get everything up and running.
        </p>
        <h2 className="text-xl font-bold mb-1">Verify that SNI is running</h2>
        <p className="mb-2">
          You should be able to see SNI in your taskbar / menubar / systray.
        </p>
        <p className="mb-12">
          If you do not see SNI here, please{' '}
          <a
            href="https://github.com/alttpo/sni/releases/latest"
            target="_blank"
          >
            download the latest version
          </a>{' '}
          and follow the instructions{' '}
          <a
            href="https://github.com/alttpo/sni?tab=readme-ov-file#for-end-users"
            target="_blank"
          >
            "For End Users"
          </a>{' '}
          in the README.
        </p>
        <h2 className="text-xl font-bold mb-1">
          Ensure you are using the latest version
        </h2>
        <p className="mb-2">
          This client requires version{' '}
          <span className="font-mono text-sm">v0.0.89</span> or later.
        </p>
        <p className="mb-12">
          Please download and install{' '}
          <a
            href="https://github.com/alttpo/sni/releases/latest"
            target="_blank"
          >
            the latest version
          </a>{' '}
          of SNI to make sure you are up to date.
        </p>
      </article>
    )
  } else {
    return <div>Unknown error</div>
  }
}
