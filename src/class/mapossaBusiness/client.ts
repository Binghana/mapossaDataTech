import User from "../user";
import IntentionEncaissement from "./intentionEncaissement";

export default class Client extends User {
    constructor(){ super(); }
    
    validate<T>( toValidate : T){
        if(IntentionEncaissement.isIE(toValidate)) {
            return IntentionEncaissement.waitingValidation(this.id  as string ,toValidate);
        }
        throw "Only validation of CashIntent has been implemented";
    }
}