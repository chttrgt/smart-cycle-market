import React, { FC } from "react";
import { View, StyleSheet } from "react-native";
import FormInput from "@ui/FormInput";
import WelcomeHeader from "@ui/WelcomeHeader";
import AppButton from "@ui/AppButton";
import FormDivider from "@ui/FormDivider";
import FormNavigator from "@ui/FormNavigator";
import CustomKeyboardAvoidingView from "@ui/CustomKeyboardAvoidingView";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { AuthStackParamList } from "app/navigator/AuthNavigator";

interface Props {}

const SignUp: FC<Props> = (props) => {
  const { navigate } = useNavigation<NavigationProp<AuthStackParamList>>();
  return (
    <CustomKeyboardAvoidingView>
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
            onLeftPress={() => navigate("ForgetPassword")}
            onRightPress={() => navigate("SignIn")}
          />
        </View>
      </View>
    </CustomKeyboardAvoidingView>
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
