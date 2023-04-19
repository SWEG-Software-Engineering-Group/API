export { default as putTenant } from './tenant/post/create';

//marco
export { default as getTenants } from './tenant/get/AllTenants';
export { default as getTenant } from './tenant/get/Tenant';
export { default as getDefaultLanguage } from './tenant/get/DefaultLanguage';
export { default as getSecondaryLanguage } from './tenant/get/SecondaryLanguage';
export { default as deleteTenants } from './tenant/delete/Tenant';
export { default as resetTenant } from './tenant/put/Tenant';
export { default as addTenantUser } from './tenant/post/addUser';
export { default as addTenantAdmin } from './tenant/post/addAdmin';
export { default as removeTenantAdmin } from './tenant/post/removeAdmin';
export { default as removeTenantUser } from './tenant/post/removeUser';

export { default as delUser } from './user/delete';
export { default as signUpUser } from './user/post/create';
export { default as getUsers } from './user/get/getUsers';
export { default as getUser } from './user/get/getUser';
export { default as adminGetUser } from './user/get/adminGetUser';
export { default as getUserGroups } from './user/get/getUserGroups';
export { default as addRole } from './user/post/addRole';
export { default as removeRole } from './user/post/removeRole';
export { default as setRole } from './user/put/updateRole';
export { default as getUserTenant } from './user/get/getTenant';


//plama
export { default as originalTexts } from './text/get/originalTexts';
export { default as allCategories } from './text/get/allCategories';
export { default as rejectedText } from './text/get/rejectedText';
export { default as untranslatedTexts } from './text/get/untranslated';
export { default as pendingTranslations } from './text/get/pendingTranslations';
export { default as textbyid } from './text/get/searchTextsById';
//put
export { default as approveText } from './text/put/approveText';
export { default as rejectText } from './text/put/rejectText';


//milo
export { default as putCategory } from './tenant/put/category';
export { default as getTenantAdmins } from './tenant/get/admin';
export { default as getTenantUsers } from './tenant/get/user';
export { default as getUserInfo } from './user/get/user';
export { default as getAllTexts } from './text/get/allTexts';
export { default as getTextFromCategory } from './text/get/textFromCategory';
export { default as getTextFromLanguage } from './text/get/textFromLanguage';
export { default as getText } from './text/get/texts';
export { default as deleteText } from './text/delete/text';
export { default as deleteLanguage } from './tenant/delete/language';
export { default as postOriginalText } from './text/post/originalText';
export { default as postTranslation } from './text/post/translation';
export { default as putTextCategory } from './text/put/textCategory';
export { default as putOriginalText } from './text/put/originalText';
export { default as putTranslation } from './text/put/translation';