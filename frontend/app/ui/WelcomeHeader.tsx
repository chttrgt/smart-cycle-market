import colors from "@utils/colors";
import React, { FC } from "react";
import { StyleSheet, Text, Image, View } from "react-native";

interface Props {}

const heading = "Thrift & Trade: A Marketplace for Used Goods";
const subHeading =
  "Join the community of people who love to buy and sell pre-owned treasures. It's easy to get started!";

const WelcomeHeader: FC<Props> = (props) => {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/hero.png")}
        style={styles.image}
        resizeMode="contain"
        resizeMethod="resize"
      />
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.subHeading}>{subHeading}</Text>
    </View>
  );
};

export default WelcomeHeader;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  image: {
    width: 250,
    height: 250,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 5,
    color: colors.primary,
  },
  subHeading: {
    fontSize: 12,
    textAlign: "center",
    color: colors.secondary,
  },
});
