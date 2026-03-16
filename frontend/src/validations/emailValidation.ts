import * as Yup from 'yup';

export const emailValidationSchema = Yup.object({
  email: Yup.string()
    .required('Required field')
    .email('Invalid email format'),
});
