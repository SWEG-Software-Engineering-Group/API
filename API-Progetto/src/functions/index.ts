export { default as getAllCategories } from './tenant/get/AllCategories';
export { default as getAdmins } from './tenant/get/Admins';
export { default as tenantGetUsers } from './tenant/get/Users';
export { default as getAllTenants } from './tenant/get/AllTenants';
export { default as getTenant } from './tenant/get/Tenant';
export { default as getUser } from './user/get/getUser';
export { default as deleteTenant } from './tenant/delete/Tenant';
export { default as addTenant } from './tenant/post/create';
export { default as getAllLanguages } from './tenant/get/Languages';
export { default as signUpUser } from './user/post/create';
export { default as deleteUser } from './user/delete/deleteUser';
export { default as textOfState } from './textcategory/get/textOfState'
export { default as getTextFromCatLang } from './textcategory/get/textFromCategoryAndLang';
// export { default as getRejectedTexts } from './textcategory/get/rejectedText';
// export { default as getToBeTranslated } from './textcategory/get/toBeTranslated';
// export { default as getToBeVerified } from './textcategory/get/getTextsToVerify';
// export { default as getVerified } from './textcategory/get/verifiedTranslations';
export { default as getText } from './textcategory/get/singleText';
export { default as putTranslation } from './textcategory/put/translation';
export { default as getAllTexts } from './textcategory/get/allTexts';
export { default as postOriginalText } from './textcategory/post/originalText';
export { default as putOriginalText } from './textcategory/put/originalText';
export { default as deleteText } from './textcategory/delete/text';

export { default as deleteAllTexts } from './textcategory/delete/Alltexts';

export { default as getOriginalTexts } from './textcategory/get/originalTexts';
export { default as getTranslationLanguages } from './textcategory/get/translationLanguages';

export { default as putAcceptText } from './textcategory/put/approveText';
export { default as putRejectText } from './textcategory/put/rejectText';
export { default as getTenantLanguages } from './tenant/get/SecondaryLanguage';
export { default as removeLanguage } from './tenant/delete/language';
export { default as addLanguage } from './tenant/post/addLanguage';
export { default as allCategories } from './textcategory/get/allCategories';
export { default as removeCategory } from './tenant/delete/removeCategory';
export { default as getCountLanguagesForCategory } from './tenant/get/categoryStats';
// export user func
export { default as admGetUser } from './user/get/adminGetUser';
export { default as getUserTenant } from './user/get/getTenant';
export { default as getUserGroups } from './user/get/getUserGroups';
export { default as getUsers } from './user/get/getUsers';
export { default as addRole } from './user/post/addRole';
export { default as removeRole } from './user/post/removeRole';
export { default as setRole } from './user/put/updateRole';
export { default as getResetCode } from './user/get/getResetCode';
export { default as resetPassword } from './user/post/resetPassword';