import { 
  ThumbsUp, ThumbsDown, LifeBuoy, Plus, Hand, Sparkles, MousePointer2, CircleOff,
  Smile, Frown, Angry, Ghost, Moon, Leaf, Annoyed, Meh,
  Bath, Utensils, CupSoda, Bed, Snowflake, Sun, Bandage, VolumeX, Shirt,
  Brain, Eye, Ear, Mic2, Activity, Stethoscope, Thermometer, 
  RotateCw, Biohazard, Droplets, Flower2, CloudRain, Pill, Ambulance,
  Gamepad2, Footprints, Octagon, ArrowRight,
  Droplet, Baby, Apple, Cookie, Croissant, GlassWater, Candy,
  ToyBrick, Tablet, Book, Armchair, ShoppingBag,
  Home, Trees, School, Store,
  Heart, UserPlus, User, LucideIcon
} from 'lucide-react';

export type Pictogram = {
  id: string;
  word: string;
  iconName: string;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  items: Pictogram[];
};

export const iconMap: Record<string, LucideIcon> = {
  ThumbsUp, ThumbsDown, LifeBuoy, Plus, Hand, Sparkles, MousePointer2, CircleOff,
  Smile, Frown, Angry, Ghost, Moon, Leaf, Annoyed, Meh,
  Bath, Utensils, CupSoda, Bed, Snowflake, Sun, Bandage, VolumeX, Shirt,
  Brain, Eye, Ear, Mic2, Activity, Stethoscope, Thermometer,
  RotateCw, Biohazard, Droplets, Flower2, CloudRain, Pill, Ambulance,
  Gamepad2, Footprints, Octagon, ArrowRight,
  Droplet, Baby, Apple, Cookie, Croissant, GlassWater, Candy,
  ToyBrick, Tablet, Book, Armchair, ShoppingBag,
  Home, Trees, School, Store,
  Heart, UserPlus, User
};

export const categories: Category[] = [
  {
    id: 'basics',
    name: 'Básicos',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    items: [
      { id: 'yes', word: 'Sí', iconName: 'ThumbsUp' },
      { id: 'no', word: 'No', iconName: 'ThumbsDown' },
      { id: 'help', word: 'Ayuda', iconName: 'LifeBuoy' },
      { id: 'more', word: 'Más', iconName: 'Plus' },
      { id: 'please', word: 'Por favor', iconName: 'Hand' },
      { id: 'thanks', word: 'Gracias', iconName: 'Sparkles' },
      { id: 'want', word: 'Quiero', iconName: 'MousePointer2' },
      { id: 'dont_want', word: 'No quiero', iconName: 'CircleOff' },
    ]
  },
  {
    id: 'emotions',
    name: 'Emociones',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    items: [
      { id: 'happy', word: 'Feliz', iconName: 'Smile' },
      { id: 'sad', word: 'Triste', iconName: 'Frown' },
      { id: 'angry', word: 'Enojado', iconName: 'Angry' },
      { id: 'scared', word: 'Asustado', iconName: 'Ghost' },
      { id: 'tired', word: 'Cansado', iconName: 'Moon' },
      { id: 'calm', word: 'Tranquilo', iconName: 'Leaf' },
      { id: 'frustrated', word: 'Frustrado', iconName: 'Annoyed' },
      { id: 'bored', word: 'Aburrido', iconName: 'Meh' },
    ]
  },
  {
    id: 'needs',
    name: 'Necesidades',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    items: [
      { id: 'bathroom', word: 'Baño', iconName: 'Bath' },
      { id: 'eat', word: 'Comer', iconName: 'Utensils' },
      { id: 'drink', word: 'Beber', iconName: 'CupSoda' },
      { id: 'sleep', word: 'Dormir', iconName: 'Bed' },
      { id: 'cold', word: 'Tengo frío', iconName: 'Snowflake' },
      { id: 'hot', word: 'Tengo calor', iconName: 'Sun' },
      { id: 'hurt', word: 'Me duele', iconName: 'Bandage' },
      { id: 'noise', word: 'Mucho ruido', iconName: 'VolumeX' },
      { id: 'dress', word: 'Vestirme', iconName: 'Shirt' },
    ]
  },
  {
    id: 'health',
    name: 'Salud',
    color: 'bg-rose-50 border-rose-200 text-rose-700',
    items: [
      { id: 'headache', word: 'Me duele mucho la cabeza', iconName: 'Brain' },
      { id: 'eye_pain', word: 'Me arden los ojos', iconName: 'Eye' },
      { id: 'ear_pain', word: 'Me duele el oído', iconName: 'Ear' },
      { id: 'throat_pain', word: 'Me duele al tragar', iconName: 'Mic2' },
      { id: 'stomach_pain', word: 'Me duele la barriga', iconName: 'Activity' },
      { id: 'tooth_pain', word: 'Me duele una muela', iconName: 'Stethoscope' },
      { id: 'fever', word: 'Tengo fiebre alta', iconName: 'Thermometer' },
      { id: 'cough', word: 'Tengo tos fuerte', iconName: 'Activity' },
      { id: 'nausea', word: 'Tengo náuseas', iconName: 'RotateCw' },
      { id: 'dizzy', word: 'Estoy mareado', iconName: 'RotateCw' },
      { id: 'vomit', word: 'Tengo vómito', iconName: 'Biohazard' },
      { id: 'diarrhea', word: 'Tengo diarrea', iconName: 'Droplets' },
      { id: 'runny_nose', word: 'Tengo moquitos', iconName: 'Droplet' },
      { id: 'allergy', word: 'Tengo alergia', iconName: 'Flower2' },
      { id: 'itchy', word: 'Me pica la piel', iconName: 'Hand' },
      { id: 'chills', word: 'Tengo escalofríos', iconName: 'CloudRain' },
      { id: 'medicine', word: 'Necesito mi medicina', iconName: 'Pill' },
      { id: 'emergency', word: 'Necesito médico ahora', iconName: 'Ambulance' },
    ]
  },
  {
    id: 'actions',
    name: 'Acciones',
    color: 'bg-red-50 border-red-200 text-red-700',
    items: [
      { id: 'play', word: 'Jugar', iconName: 'Gamepad2' },
      { id: 'look', word: 'Mirar', iconName: 'Eye' },
      { id: 'listen', word: 'Escuchar', iconName: 'Ear' },
      { id: 'walk', word: 'Pasear', iconName: 'Footprints' },
      { id: 'stop', word: 'Parar', iconName: 'Octagon' },
      { id: 'go', word: 'Ir', iconName: 'ArrowRight' },
      { id: 'give', word: 'Dar', iconName: 'Hand' },
    ]
  },
  {
    id: 'food',
    name: 'Comida',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    items: [
      { id: 'water', word: 'Agua', iconName: 'Droplet' },
      { id: 'milk', word: 'Leche', iconName: 'Baby' },
      { id: 'apple', word: 'Manzana', iconName: 'Apple' },
      { id: 'cookie', word: 'Galleta', iconName: 'Cookie' },
      { id: 'bread', word: 'Pan', iconName: 'Croissant' },
      { id: 'juice', word: 'Jugo', iconName: 'GlassWater' },
      { id: 'candy', word: 'Dulce', iconName: 'Candy' },
    ]
  },
  {
    id: 'things',
    name: 'Cosas',
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    items: [
      { id: 'toy', word: 'Juguete', iconName: 'ToyBrick' },
      { id: 'tablet', word: 'Tablet', iconName: 'Tablet' },
      { id: 'book', word: 'Libro', iconName: 'Book' },
      { id: 'bed', word: 'Cama', iconName: 'Bed' },
      { id: 'chair', word: 'Silla', iconName: 'Armchair' },
      { id: 'shoes', word: 'Zapatos', iconName: 'Footprints' },
      { id: 'backpack', word: 'Mochila', iconName: 'ShoppingBag' },
    ]
  },
  {
    id: 'places',
    name: 'Lugares',
    color: 'bg-teal-50 border-teal-200 text-teal-700',
    items: [
      { id: 'home', word: 'Casa', iconName: 'Home' },
      { id: 'park', word: 'Parque', iconName: 'Trees' },
      { id: 'school', word: 'Escuela', iconName: 'School' },
      { id: 'doctor', word: 'Médico', iconName: 'Stethoscope' },
      { id: 'store', word: 'Tienda', iconName: 'Store' },
    ]
  },
  {
    id: 'social',
    name: 'Social',
    color: 'bg-pink-50 border-pink-200 text-pink-700',
    items: [
      { id: 'hello', word: 'Hola', iconName: 'Hand' },
      { id: 'bye', word: 'Adiós', iconName: 'Hand' },
      { id: 'love', word: 'Te quiero', iconName: 'Heart' },
      { id: 'hug', word: 'Abrazo', iconName: 'UserPlus' },
      { id: 'mom', word: 'Mamá', iconName: 'User' },
      { id: 'dad', word: 'Papá', iconName: 'User' },
      { id: 'look_me', word: 'Mírame por favor', iconName: 'Eye' },
    ]
  }
];
