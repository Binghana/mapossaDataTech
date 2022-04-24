
/**
 * représentation des language supporté par mapossa
 * "FR" pour Français et "EN" pour anglais
 */
export type langage = "FR" | "EN";
/**
 * Représentation du genre d'une persone
 */
export type gender = "Homme" | "Femme" ;
/**
 * Représentation d'un numéro de télephone, aucun numéro
 * est aussi accepté
 */
export type numeroDeTelephone = numeroDeTelephoneCamerounais;
/**
 * Représentation d'un numéro de téléphone camerounais
 */
export type numeroDeTelephoneCamerounais =
    "`+2376${number}${number}${number}${number}${number}${number}${number}${number}`"
    | "`6${number}${number}${number}${number}${number}${number}${number}${number}`";
/**
 * Représentation des infromations d'un utilisateur selon
 * google
 */
export interface googleUser {
    email: string,
    emailVerified: boolean,
    displayName: string,
    photoURL?: string,
    disabled: boolean,
    password?: string,
    phoneNumber: numeroDeTelephone
};
/**
 * Représente le type final d'une transaction il peut etre
 */
export type typeFinal = "Revenu" | "Virement" | "Depense" ;
/**
 * Représente le type initial d'une transaction il peut etre
 */
export type typeInitial = "Depôt" | "Transfert" | "Retrait" | "Initialisation" | "Ajustement" ;
/**
 * Représente la les devise de monnaies acceptées par
 * Mapossa
 */
export type devise = "F CFA" ;
/**
 * Représente une heure
 */
export type heure = "`${number}``${number}`:`${number}``${number}`";
/**
 * Représente un flux de transaction
 */
export type flux = "Entrant" | "Sortant";
/**
 * Représente une décision sur la Transaction sur mapossa
 */
export type decision = "Moi même" | "Quelqu'un d'autre" | "Vers un autre de mes comptes" | "";


/**
 * Représente les cibles possibles d'une offre
 */
export type cible = cibleToutLeMonde ;
/**
 * Représente la cible tout le monde
 */
export type cibleToutLeMonde = "Tout le monde";
/**
 * Représente une requête au niveau d" l'utilisateur
 */
export type query = {
    "attribut"  : string,
    "operateur" : FirebaseFirestore.WhereFilterOp,
    "valeur": any
}

/**
 * Représente les états possible d'une intention
 */
export type etat = "Validé" | "Lancé" | "En attente de validation" | "Annulé" ;

export type typeOffre = "Spontanné" | "Récurrente";

export type typeOperateur = "Mobile" | "Espece" | "Bancaire" | "Carte";