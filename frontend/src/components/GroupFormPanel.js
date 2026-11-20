import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, MapPin, XCircle } from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const travellerOptions = [
  ['solo', 'Solo'],
  ['couple', 'Couple'],
  ['family', 'Family'],
  ['friends', 'Friends'],
  ['business', 'Business'],
];

const paceOptions = [
  ['relaxed', 'Relaxed'],
  ['moderate', 'Moderate'],
  ['packed', 'Packed'],
];

const budgetOptions = [
  ['minimum', 'Budget'],
  ['medium', 'Mid-range'],
  ['luxury', 'Luxury'],
  ['ultra', 'Ultra luxury'],
];

const distanceOptions = [
  ['2', 'Within 2 km'],
  ['5', 'Within 5 km'],
  ['10', 'Within 10 km'],
  ['25', 'Within 25 km'],
  ['50', 'Within 50 km'],
];

const roomSharingOptions = [
  ['same-gender', 'Same-gender only'],
  ['no-preference', 'No preference'],
  ['private-room', 'Private room, costlier'],
];

const budgetFlexOptions = [
  ['strict', 'Hard limit'],
  ['flexible', 'Can flex for value'],
];

const interests = ['Adventure', 'Culture', 'Food', 'Nature', 'History', 'Shopping', 'Nightlife', 'Relaxation'];
const meals = ['Local food', 'Vegetarian', 'Vegan', 'Jain', 'Halal', 'Seafood', 'Street food', 'Fine dining'];
const vibes = ['Relaxation', 'Nightlife', 'Exploration', 'Photography', 'Luxury', 'Family time', 'Shopping', 'Learning'];

const labelMap = Object.fromEntries([
  ...travellerOptions,
  ...paceOptions,
  ...budgetOptions,
  ...distanceOptions,
  ...roomSharingOptions,
  ...budgetFlexOptions,
]);

function normalizeId(value) {
  return value?._id || value || '';
}

function getMemberId(member) {
  return normalizeId(member?.userId);
}

export default function GroupFormPanel() {
  const {
    activeSession,
    voteTally,
    members,
    submitPreference,
    finalizeSession,
    cancelSession,
  } = useRoom();
  const { user } = useAuth();

  const [preferences, setPreferences] = useState({
    attending: true,
    travellerType: '',
    pace: '',
    budgetTier: '',
    distanceRange: '',
    preferences: [],
    mealPreference: [],
    tripVibe: [],
    hasChildren: false,
    hasElderly: false,
    accessibilityNeeds: false,
    roomSharing: '',
    budgetFlexibility: '',
    mustAvoid: '',
    specialRequirements: '',
  });

  const organizerId = normalizeId(activeSession?.triggeredBy);
  const isOrganizer = organizerId === user?._id;
  const organizerMember = members?.find(m => getMemberId(m) === organizerId);
  const isOrganizerOnline = organizerMember?.isOnline === true;
  const canCloseSession = isOrganizer || (organizerMember && !isOrganizerOnline);

  const hasSubmitted = useMemo(
    () => voteTally?.respondents?.some(r => r.userId === user?._id),
    [voteTally, user?._id]
  );

  useEffect(() => {
    setPreferences({
      attending: true,
      travellerType: '',
      pace: '',
      budgetTier: '',
      distanceRange: '',
      preferences: [],
      mealPreference: [],
      tripVibe: [],
      hasChildren: false,
      hasElderly: false,
      accessibilityNeeds: false,
      roomSharing: '',
      budgetFlexibility: '',
      mustAvoid: '',
      specialRequirements: '',
    });
  }, [activeSession?.sessionId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    submitPreference(activeSession.sessionId, preferences);
    toast.success(preferences.attending ? 'Preferences submitted!' : 'Marked as not coming.');
  };

  const handleToggleArray = (field, value) => {
    setPreferences(prev => {
      const arr = prev[field] || [];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };

  if (!activeSession || activeSession.status !== 'collecting') return null;

  const renderTallyBar = (label, count, totalOverride) => {
    const total = totalOverride || voteTally?.attendeeCount || voteTally?.respondentCount || 1;
    const percentage = count ? (count / total) * 100 : 0;

    return (
      <div className="flex items-center gap-2 mb-1.5 text-[11px]" key={label}>
        <div className="w-28 truncate text-gray-600">{labelMap[label] || label}</div>
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
        <div className="w-6 text-right font-medium text-gray-500">{count || 0}</div>
      </div>
    );
  };

  const renderSelect = (field, label, options, required = true) => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      <select
        value={preferences[field]}
        onChange={e => setPreferences({ ...preferences, [field]: e.target.value })}
        className="w-full text-sm border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-gray-50/50"
        required={preferences.attending && required}
      >
        <option value="">Select...</option>
        {options.map(([value, optionLabel]) => (
          <option key={value} value={value}>{optionLabel}</option>
        ))}
      </select>
      {voteTally?.[field] && Object.keys(voteTally[field]).length > 0 && (
        <div className="mt-2 pl-1 border-l-2 border-primary-200">
          {Object.entries(voteTally[field]).map(([k, v]) => renderTallyBar(k, v))}
        </div>
      )}
    </div>
  );

  const renderChipGroup = (field, label, options) => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => handleToggleArray(field, opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              preferences[field].includes(opt)
                ? 'bg-primary-100 text-primary-700 border-primary-200'
                : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {voteTally?.[field] && Object.keys(voteTally[field]).length > 0 && (
        <div className="mt-2 pl-1 border-l-2 border-primary-200">
          {Object.entries(voteTally[field])
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([k, v]) => renderTallyBar(k, v))}
        </div>
      )}
    </div>
  );

  const attendeeNames = voteTally?.attendees?.map(r => r.name).filter(Boolean) || [];

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50/80 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Group Trip Vote
            </h3>
            <p className="text-xs text-gray-500 mt-1">Only attendees shape the final plan.</p>
          </div>

          <div className="flex -space-x-1 flex-shrink-0">
            {members?.map((m, i) => {
              const memberId = getMemberId(m);
              const respondent = voteTally?.respondents?.find(r => r.userId === memberId);
              const hasVoted = Boolean(respondent);
              const isComing = respondent?.attending !== false;

              return (
                <div
                  key={memberId}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white relative ${
                    hasVoted ? (isComing ? 'bg-green-500' : 'bg-red-400') : 'bg-gray-300'
                  }`}
                  title={`${m.name} ${hasVoted ? (isComing ? '(Coming)' : '(Not coming)') : '(Waiting)'}`}
                  style={{ zIndex: 10 - i }}
                >
                  {m.name?.[0]?.toUpperCase() || '?'}
                  {hasVoted && (
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
                      {isComing ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-400" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 bg-white p-3 rounded-lg border border-gray-100 text-xs font-medium text-gray-700">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
            <span className="truncate">{activeSession.logisticsData.source} to {activeSession.logisticsData.destination}</span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-gray-500">
            <span>{activeSession.logisticsData.days} days</span>
            <span>{voteTally?.attendeeCount || 0} coming</span>
          </div>
          {attendeeNames.length > 0 && (
            <p className="mt-2 text-[11px] text-gray-500 truncate">Coming: {attendeeNames.join(', ')}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
          <section className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <span>Who's Coming</span>
              <div className="h-px bg-gray-100 flex-1" />
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreferences({ ...preferences, attending: true })}
                className={`rounded-lg border p-3 text-sm font-semibold transition-colors ${
                  preferences.attending ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                I am coming
              </button>
              <button
                type="button"
                onClick={() => setPreferences({ ...preferences, attending: false })}
                className={`rounded-lg border p-3 text-sm font-semibold transition-colors ${
                  !preferences.attending ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                Not coming
              </button>
            </div>
            {voteTally?.attending && (
              <div className="pl-1 border-l-2 border-primary-200">
                {renderTallyBar('Coming', voteTally.attending.true, voteTally.respondentCount || 1)}
                {renderTallyBar('Not coming', voteTally.attending.false, voteTally.respondentCount || 1)}
              </div>
            )}
          </section>

          {preferences.attending && (
            <>
              <section className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <span>Single Choice</span>
                  <div className="h-px bg-gray-100 flex-1" />
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderSelect('budgetTier', 'Budget comfort level', budgetOptions)}
                  {renderSelect('pace', 'Pace', paceOptions)}
                  {renderSelect('travellerType', 'Traveller type', travellerOptions)}
                  {renderSelect('distanceRange', 'Distance from centre', distanceOptions)}
                  {renderSelect('roomSharing', 'Room sharing', roomSharingOptions)}
                  {renderSelect('budgetFlexibility', 'Budget flexibility', budgetFlexOptions)}
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <span>Multiple Choice</span>
                  <div className="h-px bg-gray-100 flex-1" />
                </h4>
                {renderChipGroup('preferences', 'Interests', interests)}
                {renderChipGroup('mealPreference', 'Meal preferences', meals)}
                {renderChipGroup('tripVibe', 'Trip vibe', vibes)}
              </section>

              <section className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <span>Applies If Anyone Needs It</span>
                  <div className="h-px bg-gray-100 flex-1" />
                </h4>
                <div className="space-y-2">
                  {[
                    ['hasChildren', 'Travelling with children'],
                    ['hasElderly', 'Travelling with elderly'],
                    ['accessibilityNeeds', 'Accessibility needs'],
                  ].map(([field, label]) => (
                    <label key={field} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={preferences[field]}
                        onChange={e => setPreferences({ ...preferences, [field]: e.target.checked })}
                        className="rounded text-primary-500 focus:ring-primary-500 w-4 h-4"
                      />
                      <span className="font-medium text-gray-700 flex-1">{label}</span>
                      {voteTally?.[field] && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {voteTally[field].true || 0} yes
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <span>Free Text</span>
                  <div className="h-px bg-gray-100 flex-1" />
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Must-avoid list</label>
                  <textarea
                    value={preferences.mustAvoid}
                    onChange={e => setPreferences({ ...preferences, mustAvoid: e.target.value })}
                    maxLength={500}
                    rows={3}
                    className="w-full text-sm border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-gray-50/50 resize-none"
                    placeholder="Dealbreakers, unsafe areas, foods, activities, etc."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Special requirements</label>
                  <textarea
                    value={preferences.specialRequirements}
                    onChange={e => setPreferences({ ...preferences, specialRequirements: e.target.value })}
                    maxLength={500}
                    rows={3}
                    className="w-full text-sm border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-gray-50/50 resize-none"
                    placeholder="Anything else the group should account for."
                  />
                </div>
              </section>
            </>
          )}

          <div className="pt-4 sticky bottom-0 bg-white">
            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                hasSubmitted
                  ? 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                  : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-200'
              }`}
            >
              {hasSubmitted ? 'Update My Response' : 'Submit My Response'}
            </button>

            {canCloseSession && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                {!isOrganizer && (
                  <p className="text-xs text-amber-600 font-medium text-center">
                    Host is offline. You can dismiss or finalize this vote.
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cancelSession(activeSession.sessionId)}
                    className="flex-1 py-2 text-xs font-medium text-gray-500 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Dismiss Vote
                  </button>
                  <button
                    type="button"
                    onClick={() => finalizeSession(activeSession.sessionId)}
                    className="flex-[2] py-2 text-xs font-bold text-white bg-gray-900 hover:bg-black rounded-lg transition-colors shadow-md"
                  >
                    Generate Trip
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
