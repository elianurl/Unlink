export interface FormData {
  company: string;
  customCompany: string;
  actionType: "modify" | "delete";
  modifyField: "Nombre completo" | "DNI/NIE" | "Email" | "Teléfono" | "Dirección" | "";
  modifyNewValue: string;
  fullName: string;
  dni: string;
  contactEmail: string;
  phoneNumber: string;
}

export const COMMON_COMPANIES = [
  "Vodafone",
  "Lowi",
  "Jazztel",
  "Securitas Direct",
  "Linea Directa",
  "Iberdrola",
  "Orange",
  "Movistar",
  "Endesa",
  "Naturgy",
  "Cofidis",
  "Wizink",
  "Otro (especificar)",
];
