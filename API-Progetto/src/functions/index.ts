export { default as hello } from './hello';

export { default as deleteTenant } from './tenant/delete/Tenant';
export { default as getTenantAdmins } from './tenant/get/admin';
export { default as getTenants } from './tenant/get/AllTenants';
export { default as getDefaultLanguage } from './tenant/get/DefaultLanguage';
export { default as getSecondaryLanguage } from './tenant/get/SecondaryLanguage';
export { default as getTenant } from './tenant/get/Tenant';
export { default as getTenantUsers } from './tenant/get/user';
export { default as putTenant } from './tenant/post/create';
export { default as resetTenant } from './tenant/put/Tenant';

export { default as getAllTexts } from './text/get/allTexts';
export { default as getCategory } from './text/get/textFromCategory';
export { default as getLanguage } from './text/get/textFromLanguage';
export { default as getTexts } from './text/get/texts';

export { default as getCategories } from './textcategory/get/allCategories';
export { default as getOriginalTexts } from './textcategory/get/originalTexts';
export { default as getPendingTranslations } from './textcategory/get/pendingTranslations';
export { default as getRejectedTexts } from './textcategory/get/rejectedText';
export { default as getTextById } from './textcategory/get/searchTextsById';
export { default as getUntranslatedTexts } from './textcategory/get/untranslated';

//put
export { default as approveText } from './textcategory/put/approveText';
export { default as rejectText } from './textcategory/put/rejectText';

export { default as getUserInfo } from './user/get/user';
