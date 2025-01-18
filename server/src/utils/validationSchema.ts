import * as yup from "yup";

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/;

yup.addMethod(yup.string, "email", function validateEmail(message) {
  return this.matches(emailRegex, {
    message,
    name: "email",
    excludeEmptyString: true,
  });
});

export const newUserSchema = yup.object({
  name: yup.string().required("Name is required!"),
  email: yup
    .string()
    .email("Invalid email fomat!")
    .required("Email is required!"),
  password: yup
    .string()
    .required("Password is required!")
    .min(8, "Password must be at least 8 characters!")
    .matches(passwordRegex, "Password is not strong enough!"),
});

/*
    PASSWORD REGEX EXPLANATION

    ^ ve $: Şifrenin baştan sona kontrol edilmesini sağlar.

    (?=.*[a-z]): En az bir küçük harf içermesi gerektiğini belirtir.

    (?=.*[A-Z]): En az bir büyük harf içermesi gerektiğini belirtir.

    (?=.*\d): En az bir rakam içermesi gerektiğini belirtir.

    (?=.*[^A-Za-z\d]): En az bir özel karakter içermesi gerektiğini belirtir. Burada özel karakterler A-Za-z\d dışında herhangi bir karakter olabilir.

    [A-Za-z\d\S]{8,}: Şifrenin toplamda en az 8 karakter uzunluğunda olması gerektiğini belirtir ve 

    \S ile boşluk dışındaki tüm karakterlere izin verir.

*/
