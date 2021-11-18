import handler from 'serve-handler';
import http from 'http';
import { getOutputDir } from '../generator/joplinPlugin/pathHelper';

export class HttpServer {
  private server?: http.Server;
  async start() {
    const outputDir = await getOutputDir();
    this.server = http.createServer((request, response) =>
      handler(request, response, {
        public: outputDir,
      }),
    );
    let port = 3000;

    return new Promise<number>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.server!.on('error', (e: Error & { code: string }) => {
        if (e.code === 'EADDRINUSE') {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          this.server!.listen(++port, () => resolve(port));
        } else {
          reject(e.message);
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.server!.listen(port, '127.0.0.1', () => resolve(port));
    });
  }

  close() {
    return new Promise<void>((resolve, reject) => {
      if (!this.server) {
        return;
      }
      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
