import colors from "@utils/colors";
import React, { FC, useState } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

interface Props extends TextInputProps {}

const FormInput: FC<Props> = (props) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <TextInput
      style={[styles.input, isFocused && styles.inputFocused]}
      {...props}
      placeholderTextColor={colors.phTextColor}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
};

export default FormInput;

const styles = StyleSheet.create({
  input: {
    width: "100%",
    padding: 8,
    borderRadius: 5,
    marginBottom: 15,
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.inputBorderColor,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
});
