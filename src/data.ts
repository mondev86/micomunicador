import { 
  ThumbsUp, ThumbsDown, LifeBuoy, Plus, Hand, Sparkles, MousePointer2, CircleOff,
  Smile, Frown, Angry, Ghost, Moon, Leaf, Annoyed, Meh,
  Bath, Utensils, CupSoda, Bed, Snowflake, Sun, Bandage, VolumeX, Shirt,
  Brain, Eye, Ear, Mic2, Activity, Stethoscope, Thermometer, 
  RotateCw, Biohazard, Droplets, Flower2, CloudRain, Pill, Ambulance,
  Gamepad2, Footprints, Octagon, ArrowRight,
  Droplet, Apple, Cookie, Croissant, GlassWater, Candy,
  ToyBrick, Tablet, Book, Armchair, ShoppingBag,
  Home, Trees, School, Store,
  Heart, UserPlus, User, LucideIcon,
  Clock, Hourglass, CalendarDays, CalendarX, Sunrise, Sunset, AlarmClock,
  Coffee, Egg, Fish, Banana, Soup, Salad, UtensilsCrossed,
  MapPin, HelpCircle, Flag,
  Pencil, DoorOpen, DoorClosed,
  Star, Zap, Wind,
  Users, GraduationCap, UserX,
  ChefHat, Library, Hospital,
  RefreshCw, Award, Waves,
  Scissors, Music, Calculator, Ruler, Palette, Eraser, Timer, Dumbbell, PenLine, LogIn, LogOut, Archive,
  Target, HeartHandshake, CheckCheck, AlertCircle, SmilePlus, Vibrate, Shuffle, HeartPulse, CircleX, FlameKindling, AlertTriangle, CloudSnow, Milk, Handshake, HandHeart, UserRound, Backpack, CalendarCheck, CalendarClock, MessageCircleQuestion, BrainCircuit, BookOpen, NotebookPen,
  Baby, PersonStanding, UserRoundCheck, UserRoundPlus, Crown, Glasses, Group, Accessibility, Contact,
  ListChecks, Hash, ShieldQuestion, Dog, Cat
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
  Droplet, Apple, Cookie, Croissant, GlassWater, Candy,
  ToyBrick, Tablet, Book, Armchair, ShoppingBag,
  Home, Trees, School, Store,
  Heart, UserPlus, User,
  Clock, Hourglass, CalendarDays, CalendarX, Sunrise, Sunset, AlarmClock,
  Coffee, Egg, Fish, Banana, Soup, Salad, UtensilsCrossed,
  MapPin, HelpCircle, Flag,
  Pencil, DoorOpen, DoorClosed,
  Star, Zap, Wind,
  Users, GraduationCap, UserX,
  ChefHat, Library, Hospital,
  RefreshCw, Award, Waves,
  Scissors, Music, Calculator, Ruler, Palette, Eraser, Timer, Dumbbell, PenLine, LogIn, LogOut, Archive,
  Target, HeartHandshake, CheckCheck, AlertCircle, SmilePlus, Vibrate, Shuffle, HeartPulse, CircleX, FlameKindling, AlertTriangle, CloudSnow, Milk, Handshake, HandHeart, UserRound, Backpack, CalendarCheck, CalendarClock, MessageCircleQuestion, BrainCircuit, BookOpen, NotebookPen,
  Baby, PersonStanding, UserRoundCheck, UserRoundPlus, Crown, Glasses, Group, Accessibility, Contact,
  ListChecks, Hash, ShieldQuestion, Dog, Cat
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
      { id: 'thanks', word: 'Gracias', iconName: 'HeartHandshake' },
      { id: 'want', word: 'Quiero', iconName: 'Target' },
      { id: 'dont_want', word: 'No quiero', iconName: 'CircleOff' },
      { id: 'finish', word: 'Terminar', iconName: 'CheckCheck' },
      { id: 'wait', word: 'Esperar', iconName: 'Hourglass' },
      { id: 'again', word: 'Otra vez', iconName: 'RefreshCw' },
      { id: 'no_understand', word: 'No entiendo', iconName: 'HelpCircle' },
      { id: 'where_is', word: '¿Dónde está?', iconName: 'MapPin' },
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
      { id: 'scared', word: 'Asustado', iconName: 'AlertCircle' },
      { id: 'tired', word: 'Cansado', iconName: 'Moon' },
      { id: 'calm', word: 'Tranquilo', iconName: 'Leaf' },
      { id: 'frustrated', word: 'Frustrado', iconName: 'Annoyed' },
      { id: 'bored', word: 'Aburrido', iconName: 'Meh' },
      { id: 'surprised', word: 'Sorprendido', iconName: 'SmilePlus' },
      { id: 'nervous', word: 'Nervioso', iconName: 'Vibrate' },
      { id: 'proud', word: 'Orgulloso', iconName: 'Star' },
      { id: 'confused', word: 'Confundido', iconName: 'Shuffle' },
      { id: 'lonely', word: 'Solo', iconName: 'UserX' },
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
      { id: 'stomach_pain', word: 'Me duele la barriga', iconName: 'HeartPulse' },
      { id: 'tooth_pain', word: 'Me duele una muela', iconName: 'Stethoscope' },
      { id: 'fever', word: 'Tengo fiebre alta', iconName: 'Thermometer' },
      { id: 'cough', word: 'Tengo tos fuerte', iconName: 'Wind' },
      { id: 'nausea', word: 'Tengo náuseas', iconName: 'Waves' },
      { id: 'dizzy', word: 'Estoy mareado', iconName: 'RotateCw' },
      { id: 'vomit', word: 'Tengo vómito', iconName: 'CircleX' },
      { id: 'diarrhea', word: 'Tengo diarrea', iconName: 'Droplets' },
      { id: 'runny_nose', word: 'Tengo mocos', iconName: 'Droplet' },
      { id: 'allergy', word: 'Tengo alergia', iconName: 'AlertTriangle' },
      { id: 'itchy', word: 'Me pica la piel', iconName: 'FlameKindling' },
      { id: 'chills', word: 'Tengo escalofríos', iconName: 'CloudSnow' },
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
      { id: 'run', word: 'Correr', iconName: 'Zap' },
      { id: 'open', word: 'Abrir', iconName: 'DoorOpen' },
      { id: 'close', word: 'Cerrar', iconName: 'DoorClosed' },
      { id: 'draw', word: 'Dibujar', iconName: 'Pencil' },
      { id: 'wash', word: 'Lavar', iconName: 'Droplets' },
      { id: 'sit', word: 'Sentarse', iconName: 'Armchair' },
    ]
  },
  {
    id: 'food',
    name: 'Comida',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    items: [
      { id: 'water', word: 'Agua', iconName: 'Droplet' },
      { id: 'milk', word: 'Leche', iconName: 'Milk' },
      { id: 'apple', word: 'Manzana', iconName: 'Apple' },
      { id: 'cookie', word: 'Galleta', iconName: 'Cookie' },
      { id: 'bread', word: 'Pan', iconName: 'Croissant' },
      { id: 'juice', word: 'Jugo', iconName: 'GlassWater' },
      { id: 'candy', word: 'Dulce', iconName: 'Candy' },
      { id: 'banana', word: 'Plátano', iconName: 'Banana' },
      { id: 'egg', word: 'Huevo', iconName: 'Egg' },
      { id: 'fish', word: 'Pescado', iconName: 'Fish' },
      { id: 'soup', word: 'Sopa', iconName: 'Soup' },
      { id: 'vegetables', word: 'Verduras', iconName: 'Salad' },
      { id: 'pasta', word: 'Pasta', iconName: 'UtensilsCrossed' },
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
      { id: 'backpack', word: 'Mochila', iconName: 'Backpack' },
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
      { id: 'hospital', word: 'Hospital', iconName: 'Hospital' },
      { id: 'kitchen', word: 'Cocina', iconName: 'ChefHat' },
      { id: 'library', word: 'Biblioteca', iconName: 'Library' },
      { id: 'restaurant', word: 'Restaurante', iconName: 'UtensilsCrossed' },
    ]
  },
  {
    id: 'social',
    name: 'Social',
    color: 'bg-pink-50 border-pink-200 text-pink-700',
    items: [
      { id: 'hello', word: 'Hola', iconName: 'Hand' },
      { id: 'bye', word: 'Adiós', iconName: 'Handshake' },
      { id: 'love', word: 'Te quiero', iconName: 'Heart' },
      { id: 'hug', word: 'Abrazo', iconName: 'HandHeart' },
      { id: 'mom', word: 'Mamá', iconName: 'UserRound' },
      { id: 'dad', word: 'Papá', iconName: 'User' },
      { id: 'look_me', word: 'Mírame por favor', iconName: 'Eye' },
      { id: 'friend', word: 'Amigo', iconName: 'Users' },
      { id: 'teacher', word: 'Maestro', iconName: 'GraduationCap' },
      { id: 'well_done', word: '¡Bien hecho!', iconName: 'Award' },
    ]
  },
  {
    id: 'school',
    name: 'Colegio',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    items: [
      { id: 'sc_raise_hand', word: 'Levantar la mano', iconName: 'Hand' },
      { id: 'sc_my_turn', word: 'Es mi turno', iconName: 'Flag' },
      { id: 'sc_silence', word: 'Silencio', iconName: 'VolumeX' },
      { id: 'sc_listen_class', word: 'Escuchar al maestro', iconName: 'Ear' },
      { id: 'sc_read', word: 'Leer', iconName: 'BookOpen' },
      { id: 'sc_write', word: 'Escribir', iconName: 'PenLine' },
      { id: 'sc_draw_class', word: 'Dibujar', iconName: 'Pencil' },
      { id: 'sc_count', word: 'Matemáticas', iconName: 'Calculator' },
      { id: 'sc_paint', word: 'Pintar', iconName: 'Palette' },
      { id: 'sc_cut', word: 'Recortar', iconName: 'Scissors' },
      { id: 'sc_music', word: 'Música', iconName: 'Music' },
      { id: 'sc_gym', word: 'Gimnasia', iconName: 'Dumbbell' },
      { id: 'sc_recess', word: 'Recreo', iconName: 'Timer' },

      { id: 'sc_eraser', word: 'Goma de borrar', iconName: 'Eraser' },
      { id: 'sc_ruler', word: 'Regla', iconName: 'Ruler' },

      { id: 'sc_notebook', word: 'Cuaderno', iconName: 'NotebookPen' },
      { id: 'sc_backpack', word: 'Mochila', iconName: 'Backpack' },
      { id: 'sc_enter', word: 'Entrar a clase', iconName: 'LogIn' },
      { id: 'sc_exit', word: 'Salir de clase', iconName: 'LogOut' },
      { id: 'sc_dont_understand', word: 'No entendí', iconName: 'HelpCircle' },
      { id: 'sc_repeat', word: 'Repetir por favor', iconName: 'RefreshCw' },
    ]
  },
  {
    id: 'time',
    name: 'Tiempo',
    color: 'bg-sky-50 border-sky-200 text-sky-700',
    items: [
      { id: 'now', word: 'Ahora', iconName: 'Clock' },
      { id: 'later', word: 'Después', iconName: 'Hourglass' },
      { id: 'today', word: 'Hoy', iconName: 'CalendarCheck' },
      { id: 'tomorrow', word: 'Mañana', iconName: 'CalendarClock' },
      { id: 'yesterday', word: 'Ayer', iconName: 'CalendarX' },
      { id: 'morning', word: 'Por la mañana', iconName: 'Sunrise' },
      { id: 'afternoon', word: 'Por la tarde', iconName: 'Sunset' },
      { id: 'night_time', word: 'Por la noche', iconName: 'Moon' },
    ]
  },
  {
    id: 'routines',
    name: 'Rutinas',
    color: 'bg-lime-50 border-lime-200 text-lime-700',
    items: [
      { id: 'wake_up', word: 'Levantarse', iconName: 'AlarmClock' },
      { id: 'shower', word: 'Ducharse', iconName: 'Droplets' },
      { id: 'breakfast', word: 'Desayunar', iconName: 'Coffee' },
      { id: 'brush_teeth', word: 'Cepillar dientes', iconName: 'Smile' },
      { id: 'go_school', word: 'Ir al cole', iconName: 'School' },
      { id: 'snack', word: 'Merendar', iconName: 'Apple' },
      { id: 'dinner_time', word: 'Cenar', iconName: 'UtensilsCrossed' },
      { id: 'bath_time', word: 'Bañarse', iconName: 'Bath' },
      { id: 'bed_time', word: 'Irse a dormir', iconName: 'Bed' },
    ]
  },
  {
    id: 'questions',
    name: 'Preguntas',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    items: [
      { id: 'q_where', word: '¿Dónde?', iconName: 'MapPin' },
      { id: 'q_what', word: '¿Qué?', iconName: 'HelpCircle' },
      { id: 'q_who', word: '¿Quién?', iconName: 'Users' },
      { id: 'q_when', word: '¿Cuándo?', iconName: 'Clock' },
      { id: 'q_how', word: '¿Cómo?', iconName: 'MessageCircleQuestion' },
      { id: 'q_why', word: '¿Por qué?', iconName: 'BrainCircuit' },
      { id: 'q_which', word: '¿Cuál?', iconName: 'ListChecks' },
      { id: 'q_how_many', word: '¿Cuántos?', iconName: 'Hash' },
      { id: 'q_with_who', word: '¿Con quién?', iconName: 'UserRoundCheck' },
      { id: 'q_what_for', word: '¿Para qué?', iconName: 'Target' },
      { id: 'q_can_i', word: '¿Puedo?', iconName: 'ShieldQuestion' },
      { id: 'q_what_happened', word: '¿Qué pasó?', iconName: 'AlertCircle' },
    ]
  },
  {
    id: 'family',
    name: 'Familia',
    color: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700',
    items: [
      { id: 'fam_mom', word: 'Mamá', iconName: 'UserRound' },
      { id: 'fam_dad', word: 'Papá', iconName: 'User' },
      { id: 'fam_baby', word: 'Bebé', iconName: 'Baby' },
      { id: 'fam_brother', word: 'Hermano', iconName: 'PersonStanding' },
      { id: 'fam_sister', word: 'Hermana', iconName: 'UserRoundPlus' },
      { id: 'fam_grandma', word: 'Abuela', iconName: 'Crown' },
      { id: 'fam_grandpa', word: 'Abuelo', iconName: 'Glasses' },
      { id: 'fam_aunt', word: 'Tía', iconName: 'Contact' },
      { id: 'fam_uncle', word: 'Tío', iconName: 'UserRoundCheck' },
      { id: 'fam_cousin', word: 'Primo / Prima', iconName: 'Group' },
      { id: 'fam_family', word: 'Mi familia', iconName: 'Users' },
      { id: 'fam_pet_dog', word: 'Perro', iconName: 'Dog' },
      { id: 'fam_pet_cat', word: 'Gato', iconName: 'Cat' },
    ]
  }
];
