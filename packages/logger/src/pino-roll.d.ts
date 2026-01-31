declare module "pino-roll" {
  import type { DestinationStream } from "pino";

  export interface PinoRollOptions {
    file: string;
    frequency?: string;
    size?: string;
    dateFormat?: string;
    extension?: string;
    mkdir?: boolean;
  }

  function build(
    options: PinoRollOptions
  ): Promise<DestinationStream>;

  export default build;
}
