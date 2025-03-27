import ForgetPassword from "@views/ForgetPassword";
import SignIn from "@views/SignIn";
import SignUp from "@views/SignUp";
import { Platform, StatusBar, StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <ForgetPassword />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
});
