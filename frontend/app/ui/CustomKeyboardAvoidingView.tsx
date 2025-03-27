import React, { FC, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";

interface Props {
  children: ReactNode;
}

const CustomKeyboardAvoidingView: FC<Props> = ({ children }) => {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={30}
    >
      <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CustomKeyboardAvoidingView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
