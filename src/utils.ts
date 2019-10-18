export function supressConsoleLog() {
  // @ts-ignore
  console.log = function () {}
}
