export { default as hello } from './hello';


export { default as getAllTenants } from './tenant/get/AllTenants';
export { default as getTenant } from './tenant/get/Tenant';
export { default as getUser } from './user/get/getUser';
export { default as deleteTenant } from './tenant/delete/Tenant';
export { default as addTenant } from './tenant/post/create';
export { default as signUpUser } from './user/post/create';
export { default as addUserToTenant } from './tenant/post/addUser';
export { default as deleteUser } from './user/delete';
export { default as getRejectedText } from './textcategory/get/rejectedText';
export { default as getUntranslatedTexts } from './textcategory/get/untranslated';
export { default as getText } from './textcategory/get/singleText';
export { default as putTranslation } from './textcategory/put/translation';
export { default as getAllTexts } from './textcategory/get/allTexts';
export { default as postOriginalText } from './textcategory/post/originalText';
export { default as putOriginalText } from './textcategory/put/originalText';
export { default as getOriginalTexts } from './textcategory/get/originalTexts';
export { default as getTranslationLanguages } from './textcategory/get/translationLanguages';
export { default as getTextToVerify } from './textcategory/get/pendingTranslations';
export { default as putAcceptText } from './textcategory/put/approveText';
export { default as putRejectText } from './textcategory/put/rejectText';
export { default as getTenantLanguages } from './tenant/get/SecondaryLanguage';
export { default as removeLanguage } from './tenant/post/removeLanguage';
export { default as addLanguage } from './tenant/post/addLanguage';
export { default as allCategories } from './textcategory/get/allCategories';
export { default as removeCategory } from './tenant/post/removeCategory';








//queste non servono più, ma meglio tenerle per ora.
//marco
export { default as getDefaultLanguage } from './tenant/get/DefaultLanguage';
export { default as resetTenant } from './tenant/put/Tenant';
export { default as addTenantAdmin } from './tenant/post/addAdmin';
export { default as removeTenantAdmin } from './tenant/post/removeAdmin';
export { default as removeTenantUser } from './tenant/post/removeUser';
export { default as addCategory } from './tenant/post/addCategory';

export { default as getUsers } from './user/get/getUsers';
export { default as adminGetUser } from './user/get/adminGetUser';
export { default as getUserGroups } from './user/get/getUserGroups';
export { default as addRole } from './user/post/addRole';
export { default as removeRole } from './user/post/removeRole';
export { default as setRole } from './user/put/updateRole';
export { default as getUserTenant } from './user/get/getTenant';

//milo
export { default as getTenantAdmins } from './tenant/get/admin';
export { default as getTenantUsers } from './tenant/get/user';
export { default as getTextFromCategory } from './textcategory/get/textFromCategory';
export { default as getTextFromLanguage } from './textcategory/get/textFromLanguage';
export { default as getTextAltroNonRicordo } from './textcategory/get/texts';
export { default as deleteText } from './textcategory/delete/text';
export { default as deleteLanguage } from './tenant/delete/language';
export { default as postTranslation } from './textcategory/post/translation';
export { default as putTextCategory } from './textcategory/put/textCategory';
