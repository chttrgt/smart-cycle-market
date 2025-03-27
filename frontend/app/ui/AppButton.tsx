import colors from "@utils/colors";
import React, { FC } from "react";
import { StyleSheet, Pressable, Text } from "react-native";

interface Props {
  title: string;
  onPress?: () => void;
  active?: boolean;
}

const AppButton: FC<Props> = ({ title, active = true, onPress }) => {
  return (
    <Pressable
      style={[styles.button, active ? styles.btnActive : styles.btnDeactive]}
      onPress={onPress}
    >
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
};

export default AppButton;

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },

  btnActive: {
    backgroundColor: colors.primary,
  },
  btnDeactive: {
    backgroundColor: colors.secondary,
  },
  title: {
    color: colors.white,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
