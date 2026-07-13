// Most upstream operations have no operationId, producing generated names
// like "list2". Explicit names for every operation, keyed by method + path
// (after the path-template fixes in fix-spec.ts).
export const OPERATION_IDS: Record<string, string> = {
  "get /search": "searchAll",
  "get /search/companies": "searchCompanies",
  "get /search/officers": "searchOfficers",
  "get /search/disqualified-officers": "searchDisqualifiedOfficers",
  "get /dissolved-search/companies": "searchDissolvedCompanies",
  "get /alphabetical-search/companies": "searchCompaniesAlphabetically",
  "get /advanced-search/companies": "advancedCompanySearch",
  "get /company/{company_number}": "getCompanyProfile",
  "get /company/{company_number}/registered-office-address": "getRegisteredOfficeAddress",
  "get /company/{company_number}/officers": "listOfficers",
  "get /company/{company_number}/appointments/{appointment_id}": "getOfficerAppointment",
  "get /officers/{officer_id}/appointments": "listOfficerAppointments",
  "get /company/{company_number}/registers": "getRegisters",
  "get /company/{company_number}/filing-history": "listFilingHistory",
  "get /company/{company_number}/filing-history/{transaction_id}": "getFilingHistoryItem",
  "get /company/{company_number}/exemptions": "getExemptions",
  "get /disqualified-officers/natural/{officer_id}": "getNaturalDisqualification",
  "get /disqualified-officers/corporate/{officer_id}": "getCorporateDisqualification",
  "get /company/{company_number}/charges": "listCharges",
  "get /company/{company_number}/charges/{charge_id}": "getCharge",
  "get /company/{company_number}/insolvency": "getInsolvency",
  "get /company/{company_number}/uk-establishments": "listUkEstablishments",
  "get /company/{company_number}/persons-with-significant-control":
    "listPersonsWithSignificantControl",
  "get /company/{company_number}/persons-with-significant-control/individual/{notification_id}":
    "getIndividualPsc",
  "get /company/{company_number}/persons-with-significant-control/individual-beneficial-owner/{notification_id}":
    "getIndividualBeneficialOwner",
  "get /company/{company_number}/persons-with-significant-control/corporate-entity/{notification_id}":
    "getCorporateEntityPsc",
  "get /company/{company_number}/persons-with-significant-control/corporate-entity-beneficial-owner/{notification_id}":
    "getCorporateEntityBeneficialOwner",
  "get /company/{company_number}/persons-with-significant-control/legal-person/{notification_id}":
    "getLegalPersonPsc",
  "get /company/{company_number}/persons-with-significant-control/legal-person-beneficial-owner/{notification_id}":
    "getLegalPersonBeneficialOwner",
  "get /company/{company_number}/persons-with-significant-control-statements": "listPscStatements",
  "get /company/{company_number}/persons-with-significant-control-statements/{statement_id}":
    "getPscStatement",
  "get /company/{company_number}/persons-with-significant-control/super-secure/{super_secure_id}":
    "getSuperSecurePsc",
  "get /company/{company_number}/persons-with-significant-control/super-secure-beneficial-owner/{super_secure_id}":
    "getSuperSecureBeneficialOwner",
  "get /company/{company_number}/persons-with-significant-control/{psc_id}/notifications":
    "listPscNotifications",
};
