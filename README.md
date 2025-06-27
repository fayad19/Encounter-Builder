# Encounter Builder

A comprehensive D&D/Pathfinder encounter management tool with real-time battle tracking, creature management, and spell reference capabilities.

## Features

### 🗡️ Battle Management
- Real-time initiative tracking
- HP and condition management
- Turn-based combat system
- Automatic initiative sorting and tie resolution
- Battle state persistence

### 🐉 Creature Management
- Custom creature creation and editing
- Bestiary integration with monster database
- Creature templates and quick-add functionality
- HP, AC, and ability score tracking

### 👥 Player Management
- Player character tracking
- HP and initiative management
- Player-specific data persistence

### 📚 Spell Reference
- Comprehensive spell database
- Spell bookmarking system
- Search and filtering capabilities
- Spell details and descriptions

### 🔗 Encounter Sharing (NEW!)
- **Firebase-powered sharing** - Share encounters with other players/DMs
- **One-click sharing** - Generate shareable links instantly
- **Auto-loading** - Open a share link to automatically load the encounter
- **Cross-device sync** - Access your encounters from any device

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Firebase for sharing (see [Firebase Setup Guide](FIREBASE_SETUP.md))
4. Start the development server:
   ```bash
   npm run dev
   ```

## Encounter Sharing Setup

To enable encounter sharing functionality:

1. Follow the [Firebase Setup Guide](FIREBASE_SETUP.md)
2. Update the Firebase configuration in `src/services/firebase.js`
3. The sharing feature will be available in the "Share" tab

### How Sharing Works

1. **Save & Share**: Click "Save & Generate Share Link" to upload your current encounter to Firebase
2. **Share Link**: Copy the generated link and send it to others
3. **Auto-Load**: Recipients can simply open the link to automatically load the encounter
4. **Manual Load**: Alternatively, paste the encounter ID in the "Load Encounter" section

## Usage

### Battle Tab
- Add creatures and players to the encounter
- Start battle to begin initiative tracking
- Manage HP, conditions, and turn order
- End battle to reset the encounter

### Creatures Tab
- Create and manage custom creatures
- Add creatures to the current battle
- Edit creature stats and abilities

### Players Tab
- Add and manage player characters
- Track player HP and initiative
- Add players to the current battle

### Bestiary Tab
- Browse the monster database
- Search for specific creatures
- Add monsters to your encounter

### Spells Tab
- Search and browse spells
- Create spell bookmarks
- Reference spell details and descriptions

### Share Tab
- Save your current encounter to the cloud
- Generate shareable links
- Load encounters shared by others

## Data Storage

- **Local Storage**: All encounter data is stored locally in the browser
- **Firebase**: Encounter sharing data is stored in Firebase Firestore
- **IndexedDB**: Monster and spell databases are cached locally for performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and Bootstrap
- Monster data sourced from Pathfinder 2e
- Spell data includes both original and remastered names
- Firebase for cloud storage and sharing 