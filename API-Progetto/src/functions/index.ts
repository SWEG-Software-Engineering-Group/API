export { default as hello } from './hello';
export { default as putTenant } from './tenant/post/create';
export { default as getTenantAdmins } from './tenant/get/admin';
export { default as getTenantUsers } from './tenant/get/user';
export { default as getUserInfo } from './user/get/user';
export { default as getAllTexts } from './text/get/allTexts';
export { default as getTextFromCategory } from './text/get/textFromCategory';
export { default as getTextFromLanguage } from './text/get/textFromLanguage';
export { default as getText } from './text/get/texts';
export { default as originalTexts } from './textcategory/get/originalTexts';
export { default as allCategories } from './textcategory/get/allCategories';
export { default as rejectedText } from './textcategory/get/rejectedText';
export { default as untranslatedTexts } from './textcategory/get/untranslated';
export { default as pendingTranslations } from './textcategory/get/pendingTranslations';
export { default as textbyid } from './textcategory/get/searchTextsById';

//put
export { default as approveText } from './textcategory/put/approveText';
export { default as rejectText } from './textcategory/put/rejectText';