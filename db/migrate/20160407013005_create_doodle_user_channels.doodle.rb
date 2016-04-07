# This migration comes from doodle (originally 20160211202503)
class CreateDoodleUserChannels < ActiveRecord::Migration
  def change
    create_table :doodle_user_channels do |t|
      t.belongs_to :user, index: true, foreign_key: true
      t.belongs_to :channel, index: true, foreign_key: true
      t.string :status
      t.integer :concurrent_protocols

      t.timestamps null: false
    end
  end
end

