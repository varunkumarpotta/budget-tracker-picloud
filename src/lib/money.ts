export function toMinor(amount: number) {
  return Math.trunc(amount * 100);
}

export function fromMinor(minor: number) {
  return minor / 100;
}

