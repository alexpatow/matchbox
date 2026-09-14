import { Box, Text } from "ink";
export function Status({ title, lines }: { title: string; lines: string[] }) {
  return (
    <Box flexDirection="column" paddingY={1} gap={1}>
      <Text bold color="cyan">
        Matchbox · {title}
      </Text>
      <Box flexDirection="column">
        {lines.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Box>
    </Box>
  );
}
