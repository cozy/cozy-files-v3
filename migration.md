- https://github.com/cozy/cozy-drive/blob/master/src/drive/web/modules/layout/FolderView.jsx#L71-L73 -> composants mobiles insérés dans toutes les vues, il faudrait les insérer plus haut dans l'arbre
- Le composant FileList est opaque, on veux qu'il accepte des children pour pouvoir composer les sous-elements. De plus il ya le AsyncBoundary qui est connecté en plein milieu qu'il faut absoliment enlever.
- Filelist body a un switch pour le composant empty qui a besoin de savoir s'il est dans trash ou dans drive, on veux pas ca
- enlever les besoins de displayedFolder
- Les actions ont besoin d'un SharingConsumer pour savoir si hasWriteAccess et onFolderDelete. Possible d'utiliser un useContext ?