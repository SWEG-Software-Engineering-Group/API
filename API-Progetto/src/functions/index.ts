export { default as hello } from './hello';


export { default as getAllTenants } from './tenant/get/AllTenants';
export { default as getTenant } from './tenant/get/Tenant';
export { default as getUser } from './user/get/getUser';
export { default as deleteTenant } from './tenant/delete/Tenant';
export { default as addTenant } from './tenant/post/create';
export { default as signUpUser } from './user/post/create';
export { default as addUserToTenant } from './tenant/post/addUser';
export { default as deleteUser } from './user/delete/deleteUser';
export { default as getRejectedTexts } from './textcategory/get/rejectedText';
export { default as getUntranslatedTexts } from './textcategory/get/untranslated';
export { default as getText } from './textcategory/get/singleText';
export { default as putTranslation } from './textcategory/put/translation';
export { default as getAllTexts } from './textcategory/get/allTexts';
export { default as postOriginalText } from './textcategory/post/originalText';
export { default as putOriginalText } from './textcategory/put/originalText';
export { default as deleteText } from './textcategory/delete/text';
export { default as getOriginalTexts } from './textcategory/get/originalTexts';
export { default as getTranslationLanguages } from './textcategory/get/translationLanguages';
export { default as getTextToVerify } from './textcategory/get/pendingTranslations';
export { default as putAcceptText } from './textcategory/put/approveText';
export { default as putRejectText } from './textcategory/put/rejectText';
export { default as getTenantLanguages } from './tenant/get/SecondaryLanguage';
export { default as removeLanguage } from './tenant/delete/language';
export { default as addLanguage } from './tenant/post/addLanguage';
export { default as allCategories } from './textcategory/get/allCategories';
export { default as removeCategory } from './tenant/delete/removeCategory';
// export user func
export { default as admGetUser } from './user/get/adminGetUser';
export { default as getUserTenant } from './user/get/getTenant';
export { default as getUserGroups } from './user/get/getUserGroups';
export { default as getUsers } from './user/get/getUsers';
export { default as addRole } from './user/post/addRole';
export { default as removeRole } from './user/post/removeRole';
export { default as setRole } from './user/put/updateRole';
