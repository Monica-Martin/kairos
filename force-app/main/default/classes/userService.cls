public with sharing class userService {
    
    public static Id getUserAccountId(){
        User currentUser = [SELECT Contact.AccountId FROM User WHERE Id = :UserInfo.getUserId()];
        return currentUser.Contact.AccountId;
    }

    public static Id getUserContactId(){
        User currentUser = [SELECT ContactId FROM User WHERE Id = :UserInfo.getUserId()];
        return currentUser.ContactId;
    }
}