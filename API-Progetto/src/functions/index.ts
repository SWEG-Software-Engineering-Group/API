export { default as hello } from './hello';
export { default as putTenant } from './tenant/post/create';
export { default as originalTexts } from './textcategory/get/originalTexts';
export { default as allCategories } from './textcategory/get/allCategories';
export { default as rejectedText } from './textcategory/get/rejectedText';
export { default as untranslatedTexts } from './textcategory/get/untranslated';
export { default as pendingTranslations } from './textcategory/get/pendingTranslations';
export { default as textbyid } from './textcategory/get/searchTextsById';

//put
export { default as approveText } from './textcategory/put/approveText';
export { default as rejectText } from './textcategory/put/rejectText';