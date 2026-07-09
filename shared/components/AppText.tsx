import { Typography } from "@/styles/typography";
import { NativeSyntheticEvent, StyleProp, Text, TextLayoutEventData, TextStyle } from "react-native";
import { useTheme } from "../hooks/useTheme";

type Props = {
  type?: keyof typeof Typography;
  color?: keyof Omit<ReturnType<typeof useTheme>, "isDark">;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  ellipsizeMode?: "head" | "middle" | "tail" | "clip";
  onTextLayout?: (event: NativeSyntheticEvent<TextLayoutEventData>) => void;
  children: React.ReactNode;
};

export default function AppText({
  type = "headline-medium",
  color = "onSurface",
  style,
  children,
  onTextLayout,
  ...props
}: Props) {
  const theme = useTheme();

  return (
    <Text
      {...props}
      onTextLayout={onTextLayout}
      style={[
        Typography[type],
        {
          color: theme[color],
          flexShrink: 1,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
