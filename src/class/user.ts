import { numeroDeTelephone, googleUser, gender, langage } from "./@type";
import { dataBase, ISystemData } from "./@interface";
import { auth } from "./@interface";
import MapossaError from "./mapossaError";
import { logger } from "firebase-functions/v1";
/**
 * Une représentation d'un utilisateur mapossa
 */
export default class User implements ISystemData {

    constructor() {
        this.isSmartWallet = true;
        this.isBusiness = false;
        this.langage = "FR";
        this.disabled = false;
        this.urlPhoto = ""
    }

    /**
     * La représentation du nom de la collection où est stocké les 
     * utilisateurs de Mapossa
     */
    public static readonly collectionName = "users";
    /**
     * Représente l'identifiant de l'utilisateur de mapossa
     */
    public id: string | undefined;
    /**
     * représente l'email de l'utilisateur mapossa
     */
    public email: string | undefined;
    /**
     * Représente le genre de l'utilisateur Mapossa
     * Il peut etre soit un homme soit une femme
     * Ce champ peut etre vide
     */
    public gender: gender | undefined;
    /**
     * Indique la langue que parle l'utilisateur mapossa
     * "FR" pour Français et "EN" pour anglais
     */
    public langage: langage;
    /**
     * Représente le numéro de téléphone principal de l'utilisateur
     * mapossa 
     */
    public mainPhone: numeroDeTelephone | undefined;
    /**
     * Représente les numéros de téléphone de l'utilisateur
     * mapossa
     */
    public phones: string[] = [];
    /**
     * Représente le Prénom de l'utilisateur mapossa
     */
    public firstName: string | undefined;
    /**
     * Réprésente le Nom de l'utilisateur mapossa
     */
    public lastName: string | undefined;
    /**
     * Représente le surnom de l'utilisateur mapossa
     */
    public nickName: string | undefined;
    /**
     * Indique si l'utilisateur Mapossa est un utilisateur
     * Mapossa SmartWallet 
     */
    public isSmartWallet: boolean;
    /**
     * Indique si L'utilisateur Mapossa est un utilisateur
     * Mapossa Business
     */
    public isBusiness: boolean;
    /**
     * Représente la date de création de l'utilisateur
     */
    public createDate: Date = new Date();
    /**
     * Représente l'url vers la photo de profil de 
     * L'utilisateur Mapossa
     */
    public urlPhoto: string;
    /**
     * Représente la derniere date de mise à jour
     * des informations qui représente l'utilisateur
     */
    public updateDate: Date = new Date();
    /**
     * Représente la date à la quelle l'uilisateur
     * S'est connecté pour la dernière fois
     */
    public lastLoginDate: Date = new Date();
    /**
     * Indique si l'email de l'utilisateur est vérifiée ou pas
     */
    public emailVerified: boolean = false   ;
    /**
     * Indique si l'utilisateur est bloqué ou non
     */
    public disabled: boolean = false;

    public isPremium : boolean = false;
    public idAdalo : number = 0;
    // la méthode de normalisation
    /**
     * Cette fonction s'occupe de Changer un item de la collection
     * on un objet de type User
     * @param userItem object qui représente un utilisateur provenant
     * directement de la collection
     * @returns un object Categorie représentant l'utilisateur
     * venant de la collection
     */
    static normalize(userItem: any): User {
        const user = new User();
        if ("id" in userItem) user.id = userItem.id;
        if ("email" in userItem) user.email = userItem.email;
        if ("gender" in userItem) user.gender = userItem.gender;
        if ("langage" in userItem) user.langage = userItem.langage;
        if ("mainPhone" in userItem) user.mainPhone = userItem.mainPhone;
        if ("phones" in userItem) user.phones = userItem.phones;
        if ("firstName" in userItem) user.firstName = userItem.firstName;
        if ("lastName" in userItem) user.lastName = userItem.lastName;
        if ("nickName" in userItem) user.nickName = userItem.nickName;
        if ("isSmartWallet" in userItem) user.isSmartWallet = userItem.isSmartWallet;
        if ("isBusiness" in userItem) user.isBusiness = userItem.isBusiness;
        if ("createDate" in userItem) user.createDate = userItem.createDate;
        if ("urlPhoto" in userItem) user.urlPhoto = userItem.urlPhoto;
        if ("updateDate" in userItem) user.updateDate = userItem.updateDate;
        if ("lastLoginDate" in userItem) user.lastLoginDate = userItem.lastLoginDate;
        if ("disabled" in userItem) user.disabled = userItem.disabled;
        if ("emailVerified" in userItem) user.emailVerified = userItem.emailVerified;
        if ("isPremium" in userItem) user.isPremium = userItem.isPremium;
        if( "idAdalo" in userItem) user.idAdalo = userItem.idAdalo ;
        return user
    }
    /**
     * Cette fonction permet de convertir un grand nombre d'objet de la 
     * collection en Utilisateurs
     * @param userItems un tableau d'object représentant les
     * Utilisateurs venant directement de la collection
     * @returns un tableau d'object dont les object sont converti en type User
     */
    static bulkNormalise(userItems: object[]): User[] {
        const users: User[] = [];

        return users;
    }

    /**
     * cette fonction s'occupue de convertire les informations
     * de l'utilisateur en informations valide pour la collection
     * des utilisateurs de google
     * @returns Un object qui représente les informations de
     * l'utilisateur qui sont conforme à la collection
     * utilisateur de google
     */
    static toGoogleUser(user: any): googleUser {
        const gUser: googleUser = {
            email: user.email as string,
            emailVerified: user.emailVerified,
            disabled: user.disabled,
            displayName: user.lastName as string,
            photoURL: user.urlPhoto,
            phoneNumber: user.mainPhone as numeroDeTelephone
        };
        return gUser;
    }
    /**
     * Cette fonction s'occupe d'indiquer que l'email
     * de l'utilisateur a été vérifié
     * @param idUser Représente l'identidiant de l'utilisateur dont 
     * l'email a été vérifié   
     */
    static emailVerified(idUser: string) {

    }
    /**
     * Cette fonction s'occupe de créer un nouvel d'utilisateur
     * dans la colection utilisateur de Mapossa
     * @param user un object qui représente les informaions de
     * l'utilisateur que l'on douhaite créer
     * @returns L'utilisateur qui a été crée
     */
    static async create(user: any) {
        const uid = user.uid;
        delete user.uid;
        //if (! ("isSmartWallet" in user)) { user.isSmartWallet = true;}
        await this.collection().doc(uid).set(user);
        return { id: uid, ...user };
    }
    /**
     * cette fonction s'occupe de récupérer un utilisateur grâce à son identifiant
     * @param idUser représente l'identifiant de l'utilisateur mapossa que
     * l'on souhaite récupérer
     * @returns L'utilisateur d'identifiant donné
     */
    static async getById(idUser: string) {
        return (await this.collection().doc(idUser).get()).data();
    }
    /**
     * Cette fonction renvoie un utilisateur à partir de son email
     * @param email représente l'email de l'utilisateur
     */
    static async getByEmail ( email : string) {
    
        let user = (await this.collection().where("email", "==", email).get()).docs;

        //if( user.length ==0) throw new Error("Aucun utilisateur avec cet email n'existe")
        if ( user.length > 1) throw new MapossaError ("Fatal Error : pluieurs utilisateurs sont enregistré avec le même email : " + email);
        return user.length ==1 ? user[0].data() : undefined;
    }
    /**
     * Cette fonction s'occupe de faire passer un mapossa smarwallet en business
     * @param userId 
     */
    static async grantBusiness ( user : User) {
        
        user.isBusiness = true;
        await this.update(user)
    }

    /**
     * cette fonction s'occupe de mettre à jour les informations d'un utilisateur 
     * Mapossa
     * @param user un object qui représente les informations de l'utilisateur
     * à mettre à jour
     * @returns un object qui représente les informations de l'utilisateur
     * qui a été mis à jour
     */
    static async update(  user : any) {
        let uid = user.id as string;
        delete user.id;
        
        this.collection().doc(uid).update({...user});
        user.id = uid;
    }
    /**
     * cette fonction s'occupe e supprimer le compte utilisateur d'un utilisateur
     * Mapossa
     * @param idUser représente l'identifiant de l'utilisateur Mapossa
     * que l'on souhaite supprimer
     * @returns les informations de l'utilisateurs qui vient
     * d'etre supprimés
     */
    static async delete(idUser: string) {
        await auth.deleteUser(idUser);
        return this.collection().doc(idUser).delete();
    }
    /**
     * Renvoi la référence de la collection des utilisateurs
     * @returns 
     */
    private static collection() {
        return dataBase.collection(this.collectionName).withConverter(this.converter);
    }
    /**
         * Représente le convertisseur de données entre firestore et l'api
         */
    static converter: FirebaseFirestore.FirestoreDataConverter<User> = {
        toFirestore: function (modelObject: User): FirebaseFirestore.DocumentData {
            delete modelObject.id;
            return modelObject
        },
        fromFirestore: function (snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): User {
            const data = snapshot.data();
            const id = snapshot.id
            return User.normalize({ id: id, ...data })
        }
    }
    static async generateEmailVerificationLink(email: string) {
        const actionCodeSettings = {
            // The URL to redirect to for sign-in completion. This is also the deep
            // link for mobile redirects. The domain (www.example.com) for this URL
            // must be whitelisted in the Firebase Console.
            url: 'https://www.mapossa.com/',
            iOS: {
                bundleId: 'com.example.ios'
            },
            android: {
                packageName: 'com.example.android',
                installApp: true,
                minimumVersion: '12'
            },
            // This must be true.
            handleCodeInApp: true,
            dynamicLinkDomain: 'custom.page.link'
        };
        return await auth.generateEmailVerificationLink(email,actionCodeSettings)
    }
    public static async isPremium ( idUser : string) {
        const usr = await this.getById(idUser);
       logger.log("Voici les info de l'utilisateurs");
       logger.log(usr)
       logger.log(usr?.isPremium)
        return usr?.isPremium;
    }
}