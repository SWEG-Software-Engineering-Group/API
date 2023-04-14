export { default as hello } from './hello';
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
export { default as originalTexts } from './textcategory/get/originalTexts';
export { default as allCategories } from './textcategory/get/allCategories';
export { default as rejectedText } from './textcategory/get/rejectedText';
export { default as untranslatedTexts } from './textcategory/get/untranslated';
export { default as pendingTranslations } from './textcategory/get/pendingTranslations';
export { default as textbyid } from './textcategory/get/searchTextsById';

//put
export { default as approveText } from './textcategory/put/approveText';
export { default as rejectText } from './textcategory/put/rejectText';