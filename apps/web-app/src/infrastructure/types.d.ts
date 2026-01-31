declare module "bun" {
  interface Env {
    DATABASE_URL: string;
  }
}

declare module "*.png" {
  const value: string;
  export default value;
}
