import { Field, TextInput } from "./ui";

const fields = [
  ["name", "الاسم الكامل", { maxLength: 255 }],
  ["email", "البريد الإلكتروني", { type: "email", ltr: true, placeholder: "name@example.com" }],
  ["phone", "رقم الجوال", { type: "tel", ltr: true, placeholder: "059XXXXXXX" }],
  ["national_id", "رقم الهوية", { inputMode: "numeric", ltr: true }],
  ["password", "كلمة المرور الأولية", { type: "password", autoComplete: "new-password" }],
  ["password_confirmation", "تأكيد كلمة المرور", { type: "password", autoComplete: "new-password" }],
];

export function AccountFields({ prefix, values, errors, onChange, autoFocus }) {
  return fields.map(([name, label, inputProps], index) => {
    const id = `${prefix}-${name}`;
    return <Field key={name} id={id} label={label} required error={errors[name]}>
      <TextInput {...inputProps} id={id} required value={values[name]} error={errors[name]}
        autoFocus={autoFocus && index === 0} onChange={(event) => onChange(name, event.target.value)} />
    </Field>;
  });
}
