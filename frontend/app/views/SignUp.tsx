import React, { FC } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import FormInput from "@ui/FormInput";
import WelcomeHeader from "@ui/WelcomeHeader";
import AppButton from "@ui/AppButton";
import FormDivider from "@ui/FormDivider";
import FormNavigator from "@ui/FormNavigator";

interface Props {}

const SignUp: FC<Props> = (props) => {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={20}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.innerContainer}>
          <WelcomeHeader />
          <View style={styles.formContainer}>
            <FormInput placeholder="Name" />
            <FormInput
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FormInput placeholder="Password" secureTextEntry />
            <AppButton title="Sign Up" />
            <FormDivider />
            <FormNavigator
              leftTitle="Forgot Password?"
              rightTitle="Sign In"
              onLeftPress={() => {}}
              onRightPress={() => {}}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    padding: 15,
  },
  formContainer: {
    marginTop: 30,
  },
});

export default SignUp;
