import colors from "@utils/colors";
import React, { FC } from "react";
import {
  ColorValue,
  DimensionValue,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Props {
  width?: DimensionValue;
  height?: DimensionValue;
  backgroundColor?: ColorValue;
}

const FormDivider: FC<Props> = ({
  backgroundColor = colors.phTextColor,
  height = 1,
  width = "50%",
}) => {
  return (
    <View style={[styles.container, { width, height, backgroundColor }]} />
  );
};

export default FormDivider;

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    marginVertical: 30,
  },
});
