import { Box, Text } from "ink";
import { Select } from "@inkjs/ui";
export function Choice({
  title,
  options,
  onChange,
}: {
  title: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Box flexDirection="column" paddingY={1}>
      <Text bold>{title}</Text>
      <Select options={options} onChange={onChange} />
    </Box>
  );
}
