export default class TransactionPretraitee {
    constructor(){
        this.baseSMS = null;
        
        this.initialType = null;
        
        this.finalType = null;
        this.decision = null;

        this.operator = null;
        this.serviceCenter = null;
        
        
        
        this.amount = null;
        this.fees = null;
        this.date = null;
        this.hour = null;
        this.transactionID = null;

        this.senderName = null;
        this.senderPhoneNumber = null;

        this.receiverName = null;
        this.receiverPhoneNumber = null;

        this.balance = null;
        
        this.isAuto = true;

        this.amount_error = false;
        this.fees_error = false;
        this.date_error = false;
        this.balance_error = false;

        this.verification_error = false;

        this.user_verification = false;
    }


}