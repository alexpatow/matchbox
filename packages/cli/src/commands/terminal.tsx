import { render } from "ink";
import { Choice, Status } from "./ui/index.js";
export async function choose(title: string, options: { label: string; value: string }[]) {
  return new Promise<string>((resolve, reject) => {
    let answered = false;
    const instance = render(
      <Choice
        title={title}
        options={options}
        onChange={(value) => {
          answered = true;
          instance.unmount();
          resolve(value);
        }}
      />,
    );
    void instance.waitUntilExit().then(() => {
      if (!answered) {
        reject(new Error("Selection cancelled."));
      }
    });
  });
}
export function terminal(title: string, lines: string[]) {
  if (!process.stdout.isTTY) {
    console.log(`\nMatchbox · ${title}\n${lines.join("\n")}`);
    return { update: (next: string[]) => console.log(next.join("\n")), stop: () => {} };
  }
  const instance = render(<Status title={title} lines={lines} />);
  return {
    update: (next: string[]) => instance.rerender(<Status title={title} lines={next} />),
    stop: () => instance.unmount(),
  };
}
