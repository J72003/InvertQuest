// Allow CSS side-effect imports for nativewind
declare module '*.css' {
  const content: never;
  export default content;
}
