export { default as hello } from './hello';
export { default as putTenant } from './tenant/post/create';

//marco
export { default as getTenants } from './tenant/get/AllTenants';
export { default as getTenant } from './tenant/get/Tenant';
export { default as getDefaultLanguage } from './tenant/get/DefaultLanguage';
export { default as getSecondaryLanguage } from './tenant/get/SecondaryLanguage';
export { default as deleteTenants } from './tenant/delete/Tenant';
export { default as resetTenant } from './tenant/put/Tenant';
export { default as signUpUser } from './user/post/create';
export { default as getUsers } from './user/get/getUsers';
export { default as getUser } from './user/get/getUser';
export { default as adminGetUser } from './user/get/adminGetUser';

//plama
export { default as originalTexts } from './textcategory/get/originalTexts';
export { default as allCategories } from './textcategory/get/allCategories';
export { default as rejectedText } from './textcategory/get/rejectedText';
export { default as untranslatedTexts } from './textcategory/get/untranslated';
export { default as pendingTranslations } from './textcategory/get/pendingTranslations';
export { default as textbyid } from './textcategory/get/searchTextsById';

//put
export { default as approveText } from './textcategory/put/approveText';
export { default as rejectText } from './textcategory/put/rejectText';